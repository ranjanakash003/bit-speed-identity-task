import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function processIdentity(email?: string, phoneNumber?: string) {
  // 1. Fetch direct matches based on incoming email or phone
  const directMatches = await prisma.contact.findMany({
    where: {
      OR: [
        { email: email ? email : undefined },
        { phoneNumber: phoneNumber ? phoneNumber : undefined }
      ]
    }
  });

  // 2. Scenario: No existing contacts found -> Create new Primary
  if (directMatches.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email: email || null,               // Fix: explicitly use null
        phoneNumber: phoneNumber || null,   // Fix: explicitly use null
        linkPrecedence: 'primary'
      }
    });
    return formatResponse(newContact, []);
  }

  // 3. Scenario: Matches exist. Resolve the entire cluster of connected identities.
  const clusterIds = new Set<number>();
  directMatches.forEach(c => {
    clusterIds.add(c.id);
    if (c.linkedId) clusterIds.add(c.linkedId);
  });

  let cluster = await prisma.contact.findMany({
    where: {
      OR: [
        { id: { in: Array.from(clusterIds) } },
        { linkedId: { in: Array.from(clusterIds) } }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });

  const absolutePrimary = cluster[0];
  
  // Fix: Tell TypeScript we are absolutely sure this won't be empty
  if (!absolutePrimary) {
    throw new Error("Unexpected error: Cluster is empty"); 
  }

  // 4. Scenario: Merge Demotion
  const otherPrimaries = cluster.filter(c => c.id !== absolutePrimary.id && c.linkPrecedence === 'primary');
  
  if (otherPrimaries.length > 0) {
    const demotedIds = otherPrimaries.map(c => c.id);
    
    await prisma.contact.updateMany({
      where: { id: { in: demotedIds } },
      data: { linkPrecedence: 'secondary', linkedId: absolutePrimary.id }
    });
    
    await prisma.contact.updateMany({
      where: { linkedId: { in: demotedIds } },
      data: { linkedId: absolutePrimary.id }
    });

    cluster = await prisma.contact.findMany({
      where: {
        OR: [
          { id: absolutePrimary.id },
          { linkedId: absolutePrimary.id }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  // 5. Scenario: Check if the incoming request has NEW information
  const existingEmails = new Set(cluster.map(c => c.email).filter(Boolean));
  const existingPhones = new Set(cluster.map(c => c.phoneNumber).filter(Boolean));
  
  const isNewEmail = email && !existingEmails.has(email);
  const isNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

  if (isNewEmail || isNewPhone) {
    const newSecondary = await prisma.contact.create({
      data: {
        email: email || null,             // Fix: explicitly use null
        phoneNumber: phoneNumber || null, // Fix: explicitly use null
        linkPrecedence: 'secondary',
        linkedId: absolutePrimary.id
      }
    });
    cluster.push(newSecondary);
  }

  // 6. Format and return
  return formatResponse(absolutePrimary, cluster);
}

// Helper function to shape the final JSON response payload
function formatResponse(primary: any, cluster: any[]) {
  const emails = new Set<string>();
  const phoneNumbers = new Set<string>();
  const secondaryContactIds: number[] = [];

  if (primary.email) emails.add(primary.email);
  if (primary.phoneNumber) phoneNumbers.add(primary.phoneNumber);

  cluster.forEach(c => {
    if (c.id !== primary.id) {
      if (c.email) emails.add(c.email);
      if (c.phoneNumber) phoneNumbers.add(c.phoneNumber);
      secondaryContactIds.push(c.id);
    }
  });

  return {
    contact: {
      primaryContactId: primary.id,
      emails: Array.from(emails),
      phoneNumbers: Array.from(phoneNumbers),
      secondaryContactIds
    }
  };
}