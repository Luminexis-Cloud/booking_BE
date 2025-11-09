// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding roles, permissions, and users...');

  // Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin', description: 'Full access', userLimit: 50 },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: { name: 'Employee', description: 'Limited access', userLimit: 0 },
  });

  // Permissions (exactly matching your UI)
  const perms = [
    // Employees
    { name: 'Employees_view_all',        module: 'Employees',   action: 'view_all',        description: 'Can view all employees' },
    { name: 'Employees_edit_other',      module: 'Employees',   action: 'edit_other',      description: 'Can edit other employees' },

    // Appointments
    { name: 'Appointments_add',          module: 'Appointments', action: 'add',            description: 'Can add appointments' },
    { name: 'Appointments_edit',         module: 'Appointments', action: 'edit',           description: 'Can edit appointments' },
    { name: 'Appointments_edit_past',    module: 'Appointments', action: 'edit_past',      description: 'Can edit past appointments' },

    // Services
    { name: 'Services_add_edit',         module: 'Services',     action: 'add_edit',       description: 'Can add and edit services' },

    // Clients
    { name: 'Clients_view_phone_numbers',module: 'Clients',      action: 'view_phone_numbers', description: 'Can view client phone numbers' },

    // Invoices
    { name: 'Invoices_view',             module: 'Invoices',     action: 'view',           description: 'Can view invoices' },

    // Reports
    { name: 'Reports_view',              module: 'Reports',      action: 'view',           description: 'Can view reports' },
  ];

  const createdPerms = [];
  for (const p of perms) {
    createdPerms.push(
        await prisma.permission.upsert({
          where: { name: p.name },
          update: {},
          create: p,
        })
    );
  }

  // Admin gets everything
  await prisma.rolePermission.createMany({
    data: createdPerms.map(p => ({ roleId: adminRole.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  // Employee default = false (NO grants here).
  // If you want a baseline (e.g., allow viewing reports), add them to this list:
  const employeeGrants = [
    // example: 'Reports_view'
    // example: 'Appointments_add'
  ];
  if (employeeGrants.length) {
    await prisma.rolePermission.createMany({
      data: createdPerms
          .filter(p => employeeGrants.includes(p.name))
          .map(p => ({ roleId: employeeRole.id, permissionId: p.id })),
      skipDuplicates: true,
    });
  }

  // Users
  const hashed = await bcrypt.hash('password123', 12);

  // Admin sample (optional)
  await prisma.user.upsert({
    where: { phoneNumber: '+10000000000' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phoneNumber: '+10000000000',
      password: hashed,
      roleId: adminRole.id,
    },
  });

  // The requested employee (all permissions false by default)
  await prisma.user.upsert({
    where: { email: 'shahzadarshad21@gmail.com' },
    update: {},
    create: {
      firstName: 'Shahzad',
      lastName:  'Arshad',
      email: 'shahzadarshad21@gmail.com',
      phoneNumber: '+20000000000', // choose any unique number
      password: hashed,
      roleId: employeeRole.id,
    },
  });

  console.log('✅ Seed complete.');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
