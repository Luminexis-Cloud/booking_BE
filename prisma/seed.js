/**
 * FINAL SEED SCRIPT
 * ------------------
 * Creates:
 *  - Roles: SuperAdmin, Admin, Employee
 *  - Permissions: matching UI
 *  - Grants:
 *      → SuperAdmin: full access
 *      → Admin: full access
 *      → Employee: all false (can be overridden later)
 *  - Sample users for each role
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting seed: roles, permissions, and users...');

  // --------------------------------------------------
  // 1️⃣  Create Roles
  // --------------------------------------------------
  const [superAdminRole, adminRole, employeeRole] = await Promise.all([
    prisma.role.upsert({
      where: { name: 'SuperAdmin' },
      update: {},
      create: { name: 'SuperAdmin', description: 'Can manage admins and employees', userLimit: 100 },
    }),
    prisma.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: { name: 'Admin', description: 'Full access within assigned stores', userLimit: 50 },
    }),
    prisma.role.upsert({
      where: { name: 'Employee' },
      update: {},
      create: { name: 'Employee', description: 'Limited access', userLimit: 0 },
    }),
  ]);

  // --------------------------------------------------
  // 2️⃣  Define all Permissions (based on your UI)
  // --------------------------------------------------
  const permissionsData = [
    // Employees
    { name: 'Employees_view_all', module: 'Employees', action: 'view_all', description: 'Can view all employees' },
    { name: 'Employees_edit_other', module: 'Employees', action: 'edit_other', description: 'Can edit other employees' },

    // Appointments
    { name: 'Appointments_add', module: 'Appointments', action: 'add', description: 'Can add appointments' },
    { name: 'Appointments_edit', module: 'Appointments', action: 'edit', description: 'Can edit appointments' },
    { name: 'Appointments_edit_past', module: 'Appointments', action: 'edit_past', description: 'Can edit past appointments' },

    // Services
    { name: 'Services_add_edit', module: 'Services', action: 'add_edit', description: 'Can add and edit services' },

    // Clients
    { name: 'Clients_view_phone_numbers', module: 'Clients', action: 'view_phone_numbers', description: 'Can view client phone numbers' },

    // Invoices
    { name: 'Invoices_view', module: 'Invoices', action: 'view', description: 'Can view invoices' },

    // Reports
    { name: 'Reports_view', module: 'Reports', action: 'view', description: 'Can view reports' },
  ];

  const createdPerms = [];
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
    createdPerms.push(perm);
  }

  // --------------------------------------------------
  // 3️⃣  Assign role permissions
  // --------------------------------------------------

  // ✅ SuperAdmin → all permissions
  await prisma.rolePermission.createMany({
    data: createdPerms.map(p => ({
      roleId: superAdminRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // ✅ Admin → all permissions
  await prisma.rolePermission.createMany({
    data: createdPerms.map(p => ({
      roleId: adminRole.id,
      permissionId: p.id,
    })),
    skipDuplicates: true,
  });

  // 🚫 Employee → default false (no grants)
  const employeeGrants = []; // e.g. ['Reports_view']
  if (employeeGrants.length > 0) {
    const allowedPerms = createdPerms.filter(p =>
        employeeGrants.includes(p.name)
    );
    await prisma.rolePermission.createMany({
      data: allowedPerms.map(p => ({
        roleId: employeeRole.id,
        permissionId: p.id,
      })),
      skipDuplicates: true,
    });
  }

  // --------------------------------------------------
  // 4️⃣  Create sample users
  // --------------------------------------------------
  const hashed = await bcrypt.hash('password123', 12);

  // Super Admin
  await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      firstName: 'Super',
      lastName: 'Admin',
      email: 'superadmin@example.com',
      phoneNumber: '+110000000000',
      password: hashed,
      roleId: superAdminRole.id,
    },
  });

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phoneNumber: '+100000000000',
      password: hashed,
      roleId: adminRole.id,
    },
  });

  // Employee
  await prisma.user.upsert({
    where: { email: 'shahzadarshad21@gmail.com' },
    update: {},
    create: {
      firstName: 'Shahzad',
      lastName: 'Arshad',
      email: 'shahzadarshad21@gmail.com',
      phoneNumber: '+200000000000',
      password: hashed,
      roleId: employeeRole.id,
    },
  });

  console.log('✅ Seed complete: SuperAdmin + Admin = full access, Employee = default false.');
}

// --------------------------------------------------
// 5️⃣  Run seed
// --------------------------------------------------
main()
    .catch((e) => {
      console.error('❌ Seeding error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
