// const { PrismaClient } = require("@prisma/client");
// const bcrypt = require("bcryptjs");

// const prisma = new PrismaClient();

// async function main() {
//   console.log("🚀 Starting full seed...");

//   //
//   // 1️⃣ COMPANY
//   //
//   const company = await prisma.company.upsert({
//     where: { name: "BeautyLab Co." },
//     update: {},
//     create: {
//       name: "BeautyLab Co.",
//       domain: "beautylab",        // nickname
//       signatureName: "BeautyLab Signature",
//       country: "USA",
//       industry: "Beauty & Salon",
//       teamMembersCount: 10,
//       userLimit: 100,
//     },
//   });

//   //
//   // 2️⃣ ROLES
//   //
//   const [superAdminRole, adminRole, managerRole, employeeRole] =
//       await Promise.all([
//         prisma.role.upsert({
//           where: { name: "SuperAdmin" },
//           update: {},
//           create: {
//             name: "SuperAdmin",
//             description: "Full control over system",
//             userLimit: 100,
//             companyId: company.id,
//           },
//         }),
//         prisma.role.upsert({
//           where: { name: "Admin" },
//           update: {},
//           create: {
//             name: "Admin",
//             description: "Manages managers and employees",
//             userLimit: 50,
//             companyId: company.id,
//           },
//         }),
//         prisma.role.upsert({
//           where: { name: "Manager" },
//           update: {},
//           create: {
//             name: "Manager",
//             description: "Manages assigned employees only",
//             userLimit: 20,
//             companyId: company.id,
//           },
//         }),
//         prisma.role.upsert({
//           where: { name: "Employee" },
//           update: {},
//           create: {
//             name: "Employee",
//             description: "Performs assigned tasks only",
//             userLimit: 0,
//             companyId: company.id,
//           },
//         }),
//       ]);

//   //
//   // 3️⃣ PERMISSIONS
//   //
//   const permissionsData = [
//   // Employees
//   { name: "View all employees", module: "Employees", action: "view_all" },
//   { name: "Add employee", module: "Employees", action: "add" },
//   { name: "Edit other employees", module: "Employees", action: "edit_other" },
//   { name: "Delete employee", module: "Employees", action: "delete" },

//   // Appointments
//   { name: "Create appointment", module: "Appointments", action: "add" },
//   { name: "Edit appointment", module: "Appointments", action: "edit" },
//   { name: "Delete appointment", module: "Appointments", action: "delete" },
//   { name: "View all appointments", module: "Appointments", action: "view_all" },

//   // Services
//   { name: "Add or edit services", module: "Services", action: "add_edit" },
//   { name: "Delete services", module: "Services", action: "delete" },
//   { name: "View all services", module: "Services", action: "view_all" },

//   // Categories
//   { name: "Add or edit categories", module: "Categories", action: "add_edit" },
//   { name: "Delete categories", module: "Categories", action: "delete" },
//   { name: "View all categories", module: "Categories", action: "view_all" },

//   // Clients
//   { name: "View all clients", module: "Clients", action: "view_all" },
//   { name: "Add or edit clients", module: "Clients", action: "add_edit" },
//   { name: "Delete clients", module: "Clients", action: "delete" },
//   {
//     name: "View client phone numbers",
//     module: "Clients",
//     action: "view_phone_numbers",
//   },

//   // Invoices
//   { name: "Add or edit invoices", module: "Invoices", action: "add_edit" },
//   { name: "Delete invoices", module: "Invoices", action: "delete" },
//   { name: "View invoices", module: "Invoices", action: "view" },

//   // Reports
//   { name: "View reports", module: "Reports", action: "view" },
// ];

//   const createdPermissions = [];
//   for (const p of permissionsData) {
//     const perm = await prisma.permission.upsert({
//       where: { name: p.name },
//       update: {},
//       create: p,
//     });
//     createdPermissions.push(perm);
//   }

//   //
//   // 4️⃣ ROLE–PERMISSION MAPPING
//   //
//   const rolePerms = [];

//   for (const p of createdPermissions) {
//     rolePerms.push({ roleId: superAdminRole.id, permissionId: p.id });

//     if (!p.name.endsWith("_delete")) {
//       rolePerms.push({ roleId: adminRole.id, permissionId: p.id });
//     }

//     if (
//         [
//           "Employees_view_specific",
//           "Appointments_add",
//           "Appointments_edit",
//           "Appointments_view_all",
//           "Clients_view_all",
//           "Reports_view",
//         ].includes(p.name)
//     ) {
//       rolePerms.push({ roleId: managerRole.id, permissionId: p.id });
//     }

//     if (["Appointments_add", "Appointments_edit", "Reports_view"].includes(p.name)) {
//       rolePerms.push({ roleId: employeeRole.id, permissionId: p.id });
//     }
//   }

//   await prisma.rolePermission.createMany({ data: rolePerms, skipDuplicates: true });

//   //
//   // 5️⃣ USERS
//   //
//   const hashed = await bcrypt.hash("password123", 12);

//   const superAdmin = await prisma.user.upsert({
//     where: { email: "superadmin@beautylab.com" },
//     update: {},
//     create: {
//       firstName: "Super",
//       lastName: "Admin",
//       email: "superadmin@beautylab.com",
//       phoneNumber: "+1111111111",
//       password: hashed,
//       companyId: company.id,
//       roleId: superAdminRole.id,
//       isVerified: true,
//       isActive: true
//     },
//   });

//   const store = await prisma.store.upsert({
//     where: { name: "Main Store" },
//     update: {},
//     create: {
//       name: "Main Store",
//       areaOfWork: "Salon",
//       teamSize: 10,
//       date: new Date().toISOString(),
//       signature: "Authorized",
//       companyId: company.id,
//       managerId: superAdmin.id,
//       phoneNumber: "+923446984848"
//     },
//   });

//   const admin = await prisma.user.upsert({
//     where: { email: "admin@beautylab.com" },
//     update: {},
//     create: {
//       firstName: "Admin",
//       lastName: "User",
//       email: "admin@beautylab.com",
//       phoneNumber: "+1222222222",
//       password: hashed,
//       companyId: company.id,
//       storeId: store.id,
//       roleId: adminRole.id,
//       isVerified: true,
//       isActive: true
//     },
//   });

//   const manager = await prisma.user.upsert({
//     where: { email: "manager@beautylab.com" },
//     update: {},
//     create: {
//       firstName: "Manager",
//       lastName: "One",
//       email: "manager@beautylab.com",
//       phoneNumber: "+1333333333",
//       password: hashed,
//       companyId: company.id,
//       storeId: store.id,
//       roleId: managerRole.id,
//       isVerified: true,
//       isActive: true
//     },
//   });

//   const employee1 = await prisma.user.upsert({
//     where: { email: "employee1@beautylab.com" },
//     update: {},
//     create: {
//       firstName: "John",
//       lastName: "Doe",
//       email: "employee1@beautylab.com",
//       phoneNumber: "+1444444444",
//       password: hashed,
//       companyId: company.id,
//       storeId: store.id,
//       roleId: employeeRole.id,
//       isVerified: true,
//     },
//   });

//   const employee2 = await prisma.user.upsert({
//     where: { email: "employee2@beautylab.com" },
//     update: {},
//     create: {
//       firstName: "Jane",
//       lastName: "Smith",
//       email: "employee2@beautylab.com",
//       phoneNumber: "+1555555555",
//       password: hashed,
//       companyId: company.id,
//       storeId: store.id,
//       roleId: employeeRole.id,
//       isVerified: true,
//       isActive: true
//     },
//   });

//   //
//   // 6️⃣ ROLE → USER VISIBILITY
//   //
//   await prisma.roleUserVisibility.createMany({
//     data: [
//       { roleId: superAdminRole.id, targetId: admin.id },
//       { roleId: superAdminRole.id, targetId: manager.id },
//       { roleId: superAdminRole.id, targetId: employee1.id },
//       { roleId: superAdminRole.id, targetId: employee2.id },

//       { roleId: adminRole.id, targetId: manager.id },
//       { roleId: adminRole.id, targetId: employee1.id },
//       { roleId: adminRole.id, targetId: employee2.id },

//       { roleId: managerRole.id, targetId: employee1.id },
//       { roleId: managerRole.id, targetId: employee2.id },
//     ],
//     skipDuplicates: true,
//   });

//   //
//   // 7️⃣ USER → USER VISIBILITY
//   //
//   await prisma.employeeVisibility.createMany({
//     data: [
//       { viewerId: manager.id, targetId: employee1.id },
//       { viewerId: manager.id, targetId: employee2.id },
//     ],
//     skipDuplicates: true,
//   });

//   console.log("✅ Seed completed successfully!");
// }

// main()
//     .catch((e) => {
//       console.error("❌ Seed error:", e);
//       process.exit(1);
//     })
//     .finally(() => prisma.$disconnect());

/**
 * prisma/seed.js
 * Large-scale seed (single file) based on your existing structure:
 * - Company, Roles, Permissions, RolePermissions
 * - Users: SuperAdmin, Admins, Managers, Employees
 * - Store(s)
 * - Visibility: RoleUserVisibility + EmployeeVisibility
 * - Categories, Services
 * - EmployeeService (expertise mapping)
 * - Clients, Appointments
 *
 * Run:
 *   npx prisma db push
 *   npx prisma db seed
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// =========================
// SCALE SETTINGS (EDIT HERE)
// =========================
const SCALE = {
  STORES_COUNT: 5,
  ADMINS_PER_STORE: 1,
  MANAGERS_PER_STORE: 1,
  EMPLOYEES_PER_STORE: 5,
  CLIENTS_PER_STORE: 20,
  APPOINTMENTS_PER_STORE: 20,

  CATEGORIES_PER_STORE: 6,
  SERVICES_PER_CATEGORY: 5,

  // employee expertise: how many services each employee can do
  SERVICES_PER_EMPLOYEE_MIN: 3,
  SERVICES_PER_EMPLOYEE_MAX: 8,
};

// =========================
// DATA POOLS
// =========================
const CATEGORY_NAMES = [
  "Hair Dept",
  "Face Dept",
  "Makeup Dept",
  "Nails Dept",
  "Body Dept",
  "Grooming Dept",
  "Spa Dept",
  "Bridal Dept",
  "Skin Dept",
];

const SERVICE_TEMPLATES = [
  "Basic Serv",
  "Premium Serv",
  "Advanced Trtment",
  "Luxury Pkage",
  "Express Serv",
  "Full Care",
  "Deluxe Session",
  "Therapy",
  "Styling",
  "Special Trtment",
  "Signature Serv",
  "Deep Care",
  "Glow Trtment",
  "Repair Session",
  "Relax Pkage",
];

const FIRST_NAMES = [
  "Nouman",
  "Ali",
  "Sarah",
  "Ayesha",
  "John",
  "Jane",
  "Fatima",
  "Usman",
  "Ahmed",
  "Hina",
  "Bilal",
  "Hamza",
  "Zara",
  "Omar",
  "Amna",
  "Danish",
  "Iqra",
  "Hassan",
  "Sana",
  "Saad",
];

const LAST_NAMES = [
  "Naveed",
  "Khan",
  "Raza",
  "Smith",
  "Doe",
  "Ahmed",
  "Butt",
  "Malik",
  "Shah",
  "Sheikh",
  "Chaudhry",
  "Hussain",
  "Iqbal",
  "Ali",
  "Siddiqui",
  "Awan",
  "Qureshi",
  "Mehmood",
];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}
function safeEmail(prefix, storeIndex, userIndex) {
  return `${prefix}_${storeIndex}_${userIndex}@beautylab.com`.toLowerCase();
}

async function main() {
  console.log("🚀 Starting LARGE SCALE seed...");

  // =========================
  // 1) COMPANY
  // =========================
  const company = await prisma.company.upsert({
    where: { name: "BeautyLab Co." },
    update: {},
    create: {
      name: "BeautyLab Co.",
      domain: "beautylab",
      signatureName: "BeautyLab Signature",
      country: "USA",
      industry: "Beauty & Salon",
      teamMembersCount: 10,
      userLimit: 1000,
    },
  });

  // =========================
  // 2) ROLES
  // =========================
  const [superAdminRole, adminRole, managerRole, employeeRole] =
    await Promise.all([
      prisma.role.upsert({
        where: { name: "SuperAdmin" },
        update: {},
        create: {
          name: "SuperAdmin",
          description: "Full control over system",
          userLimit: 1000,
          companyId: company.id,
        },
      }),
      prisma.role.upsert({
        where: { name: "Admin" },
        update: {},
        create: {
          name: "Admin",
          description: "Manages managers and employees",
          userLimit: 500,
          companyId: company.id,
        },
      }),
      prisma.role.upsert({
        where: { name: "Manager" },
        update: {},
        create: {
          name: "Manager",
          description: "Manages assigned employees only",
          userLimit: 200,
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

  // =========================
  // 3) PERMISSIONS
  // =========================
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
    {
      name: "View all appointments",
      module: "Appointments",
      action: "view_all",
    },

    // Services
    { name: "Add or edit services", module: "Services", action: "add_edit" },
    { name: "Delete services", module: "Services", action: "delete" },
    { name: "View all services", module: "Services", action: "view_all" },

    // Categories
    {
      name: "Add or edit categories",
      module: "Categories",
      action: "add_edit",
    },
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

  // =========================
  // 4) ROLE-PERMISSION MAPPING
  // =========================
  // NOTE: Your original mapping logic was using name patterns like "_delete"
  // but your permission names don't follow that. We'll map by module/action rules.
  // SuperAdmin: all
  // Admin: all except "Delete" actions (example policy)
  // Manager: view appointments + create/edit appointments + view clients + reports
  // Employee: create/edit appointment + reports
  const rolePerms = [];
  for (const p of createdPermissions) {
    rolePerms.push({ roleId: superAdminRole.id, permissionId: p.id });

    const isDeleteAction = p.action === "delete";
    if (!isDeleteAction) {
      rolePerms.push({ roleId: adminRole.id, permissionId: p.id });
    }

    const managerAllowed =
      (p.module === "Appointments" &&
        ["add", "edit", "view_all"].includes(p.action)) ||
      (p.module === "Clients" && ["view_all"].includes(p.action)) ||
      (p.module === "Reports" && ["view"].includes(p.action)) ||
      (p.module === "Employees" && ["view_all"].includes(p.action));

    if (managerAllowed) {
      rolePerms.push({ roleId: managerRole.id, permissionId: p.id });
    }

    const employeeAllowed =
      (p.module === "Appointments" && ["add", "edit"].includes(p.action)) ||
      (p.module === "Reports" && ["view"].includes(p.action));

    if (employeeAllowed) {
      rolePerms.push({ roleId: employeeRole.id, permissionId: p.id });
    }
  }

  await prisma.rolePermission.createMany({
    data: rolePerms,
    skipDuplicates: true,
  });

  // =========================
  // 5) BASE USERS (SUPERADMIN)
  // =========================
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
      isActive: true,
    },
  });

  // We'll create Store 1 as "Main Store" (keep your existing naming)
  const stores = [];

  const mainStore = await prisma.store.upsert({
    where: { name: "Main Store" },
    update: {},
    create: {
      name: "Main Store",
      areaOfWork: "Salon",
      teamSize: SCALE.EMPLOYEES_PER_STORE,
      date: new Date().toISOString(),
      signature: "Authorized",
      companyId: company.id,
      managerId: superAdmin.id,
      phoneNumber: "+923446984848",
    },
  });

  await prisma.user.update({
    where: { id: superAdmin.id },
    data: {
      storeId: mainStore.id, // or storeId
    },
  });
  stores.push(mainStore);

  // Create remaining stores
  for (let s = 2; s <= SCALE.STORES_COUNT; s++) {
    const st = await prisma.store.upsert({
      where: { name: `Branch Store ${s}` },
      update: {},
      create: {
        name: `Branch Store ${s}`,
        areaOfWork: "Salon",
        teamSize: SCALE.EMPLOYEES_PER_STORE,
        date: new Date().toISOString(),
        signature: "Authorized",
        companyId: company.id,
        managerId: superAdmin.id,
        phoneNumber: `+9230000000${s}`,
      },
    });
    stores.push(st);
  }

  // =========================
  // 6) CREATE ADMINS/MANAGERS/EMPLOYEES PER STORE
  // =========================
  const allAdmins = [];
  const allManagers = [];
  const allEmployees = [];

  for (let si = 0; si < stores.length; si++) {
    const store = stores[si];
    const storeIndex = si + 1;

    console.log(`🏬 Seeding users for: ${store.name}`);

    // Admin(s)
    for (let a = 1; a <= SCALE.ADMINS_PER_STORE; a++) {
      const adminEmail = safeEmail("admin", storeIndex, a);
      const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          storeId: store.id,
          companyId: company.id,
          roleId: adminRole.id,
          isActive: true,
          isVerified: true,
        },
        create: {
          firstName: "Admin",
          lastName: `Store${storeIndex}`,
          email: adminEmail,
          phoneNumber: `+1200${storeIndex}${a}0000`,
          password: hashed,
          userType: 'EMPLOYEE',
          companyId: company.id,
          storeId: store.id,
          roleId: adminRole.id,
          isVerified: true,
          isActive: true,
        },
      });
      allAdmins.push(adminUser);
    }

    // Manager(s)
    for (let m = 1; m <= SCALE.MANAGERS_PER_STORE; m++) {
      const managerEmail = safeEmail("manager", storeIndex, m);
      const managerUser = await prisma.user.upsert({
        where: { email: managerEmail },
        update: {
          storeId: store.id,
          companyId: company.id,
          roleId: managerRole.id,
          isActive: true,
          isVerified: true,
        },
        create: {
          firstName: "Manager",
          lastName: `Store${storeIndex}`,
          email: managerEmail,
          phoneNumber: `+1300${storeIndex}${m}0000`,
          password: hashed,
          userType: 'EMPLOYEE',
          companyId: company.id,
          storeId: store.id,
          roleId: managerRole.id,
          isVerified: true,
          isActive: true,
        },
      });
      allManagers.push(managerUser);
    }

    // Employees
    for (let e = 1; e <= SCALE.EMPLOYEES_PER_STORE; e++) {
      const firstName = pick(FIRST_NAMES);
      const lastName = pick(LAST_NAMES);
      const employeeEmail = safeEmail("employee", storeIndex, e);

      const employeeUser = await prisma.user.upsert({
        where: { email: employeeEmail },
        update: {
          storeId: store.id,
          companyId: company.id,
          roleId: employeeRole.id,
          isActive: true,
          isVerified: true,
        },
        create: {
          firstName,
          lastName,
          email: employeeEmail,
          phoneNumber: `+1400${storeIndex}${e}0000`,
          password: hashed,
          userType: 'EMPLOYEE',
          companyId: company.id,
          storeId: store.id,
          roleId: employeeRole.id,
          isVerified: true,
          isActive: true,
        },
      });

      allEmployees.push(employeeUser);
    }
  }

  // =========================
  // 7) VISIBILITY RULES (ROLE -> USER)
  // =========================
  // Policy:
  // - SuperAdmin can see all admins/managers/employees
  // - Admins can see managers & employees in their store
  // - Managers can see employees in their store
  const roleVisibilityRows = [];

  for (const u of [...allAdmins, ...allManagers, ...allEmployees]) {
    roleVisibilityRows.push({ roleId: superAdminRole.id, targetId: u.id });
  }

  // Admin role visibility targets: all managers+employees (we keep it broad)
  for (const u of [...allManagers, ...allEmployees]) {
    roleVisibilityRows.push({ roleId: adminRole.id, targetId: u.id });
  }

  // Manager role: employees
  for (const u of allEmployees) {
    roleVisibilityRows.push({ roleId: managerRole.id, targetId: u.id });
  }

  await prisma.roleUserVisibility.createMany({
    data: roleVisibilityRows,
    skipDuplicates: true,
  });

  // =========================
  // 8) USER -> USER VISIBILITY (MANAGER -> EMPLOYEES IN SAME STORE)
  // =========================
  const employeeVisibilityRows = [];

  // Map managers to employees by storeId
  const employeesByStore = new Map();
  for (const emp of allEmployees) {
    if (!employeesByStore.has(emp.storeId))
      employeesByStore.set(emp.storeId, []);
    employeesByStore.get(emp.storeId).push(emp);
  }

  for (const mgr of allManagers) {
    const emps = employeesByStore.get(mgr.storeId) || [];
    for (const emp of emps) {
      employeeVisibilityRows.push({ viewerId: mgr.id, targetId: emp.id });
    }
  }

  await prisma.employeeVisibility.createMany({
    data: employeeVisibilityRows,
    skipDuplicates: true,
  });

  // =========================
  // 9) CATEGORIES + SERVICES PER STORE
  // =========================
  // We'll create categories/services per store, and then map employee expertise.
  const allServicesByStore = new Map(); // storeId -> services[]

  for (let si = 0; si < stores.length; si++) {
    const store = stores[si];

    console.log(`🧩 Seeding categories/services for: ${store.name}`);

    const categoryNames = CATEGORY_NAMES.slice(0, SCALE.CATEGORIES_PER_STORE);

    // categories
    const categories = [];
    for (const catName of categoryNames) {
      const cat = await prisma.category.create({
        data: { name: catName, storeId: store.id },
      });
      categories.push(cat);
    }

    // services
    const createdServices = [];
    for (const cat of categories) {
      // create services per category
      const templates = shuffle(SERVICE_TEMPLATES).slice(
        0,
        SCALE.SERVICES_PER_CATEGORY
      );
      for (const tmpl of templates) {
        const svc = await prisma.service.create({
          data: {
            name: `${tmpl} - ${cat.name} (${store.name})`,
            description: `Seeded service for ${cat.name} in ${store.name}`,
            durationMinutes: randInt(20, 120),
            price: { amount: randInt(10, 250), currency: "USD" },
            deposit: { amount: randInt(0, 50), currency: "USD" },
            colorHex: "#F5C542",
            isActive: true,
            date: new Date().toISOString(),
            storeId: store.id,
            categoryId: cat.id,
          },
        });
        createdServices.push(svc);
      }
    }

    allServicesByStore.set(store.id, createdServices);
  }

  // =========================
  // 10) EMPLOYEE SERVICE (EXPERTISE) MAPPING
  // =========================
  console.log("🧠 Mapping employee expertise (EmployeeService)...");

  for (const emp of allEmployees) {
    const storeServices = allServicesByStore.get(emp.storeId) || [];
    if (!storeServices.length) continue;

    const count = randInt(
      SCALE.SERVICES_PER_EMPLOYEE_MIN,
      Math.min(SCALE.SERVICES_PER_EMPLOYEE_MAX, storeServices.length)
    );

    const selected = shuffle(storeServices).slice(0, count);

    await prisma.employeeService.createMany({
      data: selected.map((svc) => ({
        employeeId: emp.id,
        serviceId: svc.id,
        storeId: emp.storeId,
      })),
      skipDuplicates: true,
    });
  }

  // =========================
  // 11) CLIENTS PER STORE
  // =========================
  console.log("👥 Seeding clients...");

  const allClientsByStore = new Map();

  for (const store of stores) {
    const clients = [];

    for (let i = 1; i <= SCALE.CLIENTS_PER_STORE; i++) {
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      const email = `client_${store.id}_${i}@mail.com`.toLowerCase();

      const client = await prisma.client.create({
        data: {
          name,
          phone: `+1500${store.id.slice(-3)}${i}00`,
          email,
          notes: "Seeded client",
          isActive: true,
          userId: superAdmin.id, // creator user
          storeId: store.id,
          information: [{ note: "Welcome client" }],
        },
      });

      clients.push(client);
    }

    allClientsByStore.set(store.id, clients);
  }

  // =========================
  // 12) APPOINTMENTS PER STORE
  // =========================
  console.log("📅 Seeding appointments...");

  console.log("📅 Seeding appointments...");

  for (const store of stores) {
    const employees = employeesByStore.get(store.id) || [];
    const clients = allClientsByStore.get(store.id) || [];
    const services = allServicesByStore.get(store.id) || [];

    if (!employees.length || !clients.length || !services.length) continue;

    // prefetch expertise for store
    const empServices = await prisma.employeeService.findMany({
      where: { storeId: store.id },
      select: { employeeId: true, serviceId: true },
    });

    const servicesByEmployee = new Map();
    for (const row of empServices) {
      if (!servicesByEmployee.has(row.employeeId)) {
        servicesByEmployee.set(row.employeeId, []);
      }
      servicesByEmployee.get(row.employeeId).push(row.serviceId);
    }

    for (let i = 1; i <= SCALE.APPOINTMENTS_PER_STORE; i++) {
      const employee = pick(employees);
      const client = pick(clients);

      const allowedServiceIds = servicesByEmployee.get(employee.id) || [];
      if (!allowedServiceIds.length) continue;

      const serviceId = pick(allowedServiceIds);

      const startTime = new Date();
      startTime.setDate(startTime.getDate() + randInt(0, 30));
      startTime.setHours(randInt(9, 18), [0, 15, 30, 45][randInt(0, 3)], 0, 0);

      const duration = randInt(30, 90);
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const dateOnly = new Date(
        startTime.getFullYear(),
        startTime.getMonth(),
        startTime.getDate()
      );

      // ✅ CREATE APPOINTMENT (CURRENT MODEL)
      const appointment = await prisma.appointment.create({
        data: {
          date: dateOnly,
          startTime,
          endTime,

          color: "gold",

          recurrence: null,

          downPayment: null,
          totalPayment: null,

          sendSms: false,
          smsReminder: null,

          storeId: store.id,
          employeeId: employee.id,
          clientId: client.id,
        },
      });

      // ✅ LINK SERVICE
      await prisma.appointmentService.create({
        data: {
          appointmentId: appointment.id,
          serviceId,
        },
      });
    }
  }
  console.log("✅ LARGE SCALE seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
