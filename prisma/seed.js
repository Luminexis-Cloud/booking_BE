const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting full seed...");

  //
  // 1️⃣ COMPANY
  //
  const company = await prisma.company.upsert({
    where: { name: "BeautyLab Co." },
    update: {},
    create: {
      name: "BeautyLab Co.",
      domain: "beautylab",        // nickname
      signatureName: "BeautyLab Signature",
      country: "USA",
      industry: "Beauty & Salon",
      teamMembersCount: 10,
      userLimit: 100,
    },
  });

  //
  // 2️⃣ ROLES
  //
  const [superAdminRole, adminRole, managerRole, employeeRole] =
      await Promise.all([
        prisma.role.upsert({
          where: { name: "SuperAdmin" },
          update: {},
          create: {
            name: "SuperAdmin",
            description: "Full control over system",
            userLimit: 100,
            companyId: company.id,
          },
        }),
        prisma.role.upsert({
          where: { name: "Admin" },
          update: {},
          create: {
            name: "Admin",
            description: "Manages managers and employees",
            userLimit: 50,
            companyId: company.id,
          },
        }),
        prisma.role.upsert({
          where: { name: "Manager" },
          update: {},
          create: {
            name: "Manager",
            description: "Manages assigned employees only",
            userLimit: 20,
            companyId: company.id,
          },
        }),
        prisma.role.upsert({
          where: { name: "Employee" },
          update: {},
          create: {
            name: "Employee",
            description: "Performs assigned tasks only",
            userLimit: 0,
            companyId: company.id,
          },
        }),
      ]);

  //
  // 3️⃣ PERMISSIONS
  //
  const permissionsData = [
  // Employees
  { name: "View all employees", module: "Employees", action: "view_all" },
  { name: "Add employee", module: "Employees", action: "add" },
  { name: "Edit other employees", module: "Employees", action: "edit_other" },
  { name: "Delete employee", module: "Employees", action: "delete" },

  // Appointments
  { name: "Create appointment", module: "Appointments", action: "add" },
  { name: "Edit appointment", module: "Appointments", action: "edit" },
  { name: "Delete appointment", module: "Appointments", action: "delete" },
  { name: "View all appointments", module: "Appointments", action: "view_all" },

  // Services
  { name: "Add or edit services", module: "Services", action: "add_edit" },
  { name: "Delete services", module: "Services", action: "delete" },
  { name: "View all services", module: "Services", action: "view_all" },

  // Categories
  { name: "Add or edit categories", module: "Categories", action: "add_edit" },
  { name: "Delete categories", module: "Categories", action: "delete" },
  { name: "View all categories", module: "Categories", action: "view_all" },

  // Clients
  { name: "View all clients", module: "Clients", action: "view_all" },
  { name: "Add or edit clients", module: "Clients", action: "add_edit" },
  { name: "Delete clients", module: "Clients", action: "delete" },
  {
    name: "View client phone numbers",
    module: "Clients",
    action: "view_phone_numbers",
  },

  // Invoices
  { name: "Add or edit invoices", module: "Invoices", action: "add_edit" },
  { name: "Delete invoices", module: "Invoices", action: "delete" },
  { name: "View invoices", module: "Invoices", action: "view" },

  // Reports
  { name: "View reports", module: "Reports", action: "view" },
];


  const createdPermissions = [];
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
    createdPermissions.push(perm);
  }

  //
  // 4️⃣ ROLE–PERMISSION MAPPING
  //
  const rolePerms = [];

  for (const p of createdPermissions) {
    rolePerms.push({ roleId: superAdminRole.id, permissionId: p.id });

    if (!p.name.endsWith("_delete")) {
      rolePerms.push({ roleId: adminRole.id, permissionId: p.id });
    }

    if (
        [
          "Employees_view_specific",
          "Appointments_add",
          "Appointments_edit",
          "Appointments_view_all",
          "Clients_view_all",
          "Reports_view",
        ].includes(p.name)
    ) {
      rolePerms.push({ roleId: managerRole.id, permissionId: p.id });
    }

    if (["Appointments_add", "Appointments_edit", "Reports_view"].includes(p.name)) {
      rolePerms.push({ roleId: employeeRole.id, permissionId: p.id });
    }
  }

  await prisma.rolePermission.createMany({ data: rolePerms, skipDuplicates: true });

  //
  // 5️⃣ USERS
  //
  const hashed = await bcrypt.hash("password123", 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@beautylab.com" },
    update: {},
    create: {
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@beautylab.com",
      phoneNumber: "+1111111111",
      password: hashed,
      companyId: company.id,
      roleId: superAdminRole.id,
      isVerified: true,
    },
  });

  const store = await prisma.store.upsert({
    where: { name: "Main Store" },
    update: {},
    create: {
      name: "Main Store",
      areaOfWork: "Salon",
      teamSize: 10,
      date: new Date().toISOString(),
      signature: "Authorized",
      companyId: company.id,
      managerId: superAdmin.id,
      phoneNumber: "+923446984848"
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@beautylab.com" },
    update: {},
    create: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@beautylab.com",
      phoneNumber: "+1222222222",
      password: hashed,
      companyId: company.id,
      storeId: store.id,
      roleId: adminRole.id,
      isVerified: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@beautylab.com" },
    update: {},
    create: {
      firstName: "Manager",
      lastName: "One",
      email: "manager@beautylab.com",
      phoneNumber: "+1333333333",
      password: hashed,
      companyId: company.id,
      storeId: store.id,
      roleId: managerRole.id,
      isVerified: true,
    },
  });

  const employee1 = await prisma.user.upsert({
    where: { email: "employee1@beautylab.com" },
    update: {},
    create: {
      firstName: "John",
      lastName: "Doe",
      email: "employee1@beautylab.com",
      phoneNumber: "+1444444444",
      password: hashed,
      companyId: company.id,
      storeId: store.id,
      roleId: employeeRole.id,
      isVerified: true,
    },
  });

  const employee2 = await prisma.user.upsert({
    where: { email: "employee2@beautylab.com" },
    update: {},
    create: {
      firstName: "Jane",
      lastName: "Smith",
      email: "employee2@beautylab.com",
      phoneNumber: "+1555555555",
      password: hashed,
      companyId: company.id,
      storeId: store.id,
      roleId: employeeRole.id,
      isVerified: true,
    },
  });

  //
  // 6️⃣ ROLE → USER VISIBILITY
  //
  await prisma.roleUserVisibility.createMany({
    data: [
      { roleId: superAdminRole.id, targetId: admin.id },
      { roleId: superAdminRole.id, targetId: manager.id },
      { roleId: superAdminRole.id, targetId: employee1.id },
      { roleId: superAdminRole.id, targetId: employee2.id },

      { roleId: adminRole.id, targetId: manager.id },
      { roleId: adminRole.id, targetId: employee1.id },
      { roleId: adminRole.id, targetId: employee2.id },

      { roleId: managerRole.id, targetId: employee1.id },
      { roleId: managerRole.id, targetId: employee2.id },
    ],
    skipDuplicates: true,
  });

  //
  // 7️⃣ USER → USER VISIBILITY
  //
  await prisma.employeeVisibility.createMany({
    data: [
      { viewerId: manager.id, targetId: employee1.id },
      { viewerId: manager.id, targetId: employee2.id },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed completed successfully!");
}

main()
    .catch((e) => {
      console.error("❌ Seed error:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
