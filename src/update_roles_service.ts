import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Manual .env parser to avoid external dependencies
function loadEnv() {
  try {
    const envPath = join(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      } else if (value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch (e) {
    console.warn("Warning: Could not read .env file:", e);
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase URL or Service Role Key in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("Connecting to Supabase...");
  
  // 1. Fetch users from auth.users (requires service_role)
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    console.error("Error fetching users:", usersError);
    process.exit(1);
  }

  console.log(`Found ${users?.length} users.`);

  // 2. Identify the target users
  const adminUser = users?.find(u => u.email === "rupavathivoosa2003@gmail.com");
  const superAdminUser = users?.find(u => u.email === "fowadyxu@forexzig.com");

  if (!adminUser) {
    console.log("Admin user rupavathivoosa2003@gmail.com not found. They must sign up first.");
  } else {
    console.log(`Found Admin user: ${adminUser.email} (ID: ${adminUser.id})`);
    
    // Remove super_admin role
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", adminUser.id)
      .eq("role", "super_admin");
    if (delErr) console.error("Error removing super_admin role from admin:", delErr);
    else console.log("Removed super_admin role from admin user.");

    // Add admin role
    const { error: insErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: adminUser.id, role: "admin" }, { onConflict: "user_id,role" });
    if (insErr) console.error("Error ensuring admin role for admin:", insErr);
    else console.log("Ensured admin role for admin user.");
  }

  if (!superAdminUser) {
    console.log("Super Admin user fowadyxu@forexzig.com not found. Creating auth user now...");
    const { data: newSuperUser, error: createErr } = await supabase.auth.admin.createUser({
      email: "fowadyxu@forexzig.com",
      password: "Admin@123",
      email_confirm: true,
    });

    if (createErr) {
      console.error("Error creating Super Admin user:", createErr);
    } else if (newSuperUser.user) {
      const u = newSuperUser.user;
      console.log(`Successfully created Super Admin user: ${u.email} (ID: ${u.id})`);
      
      // Ensure super_admin role
      const { error: insErr } = await supabase
        .from("user_roles")
        .upsert({ user_id: u.id, role: "super_admin" }, { onConflict: "user_id,role" });
      if (insErr) console.error("Error assigning super_admin role:", insErr);
      else console.log("Assigned super_admin role to new user.");
    }
  } else {
    console.log(`Found Super Admin user: ${superAdminUser.email} (ID: ${superAdminUser.id})`);

    // Remove admin role
    const { error: delErr } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", superAdminUser.id)
      .eq("role", "admin");
    if (delErr) console.error("Error removing admin role from superadmin:", delErr);
    else console.log("Removed admin role from superadmin user.");

    // Add super_admin role
    const { error: insErr } = await supabase
      .from("user_roles")
      .upsert({ user_id: superAdminUser.id, role: "super_admin" }, { onConflict: "user_id,role" });
    if (insErr) console.error("Error ensuring super_admin role for superadmin:", insErr);
    else console.log("Ensured super_admin role for superadmin user.");
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
});
