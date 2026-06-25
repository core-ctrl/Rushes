import connectDB from "@/lib/mongodb";
import SystemSettings from "@/models/SystemSettings";

export async function getSystemSettings() {
  try {
    await connectDB();
    const settings = await SystemSettings.findOne().lean();
    return settings || {};
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    return {};
  }
}

export async function checkAuthEnabled(action = "login") {
  const settings = await getSystemSettings();
  
  if (settings.maintenanceMode) {
    return {
      allowed: false,
      message: "System is currently undergoing maintenance. Please try again later."
    };
  }
  
  if (action === "login" && settings.disableLogins) {
    return {
      allowed: false,
      message: "Logins are temporarily disabled by the administrator."
    };
  }
  
  if (action === "register" && settings.disableSignups) {
    return {
      allowed: false,
      message: "New account signups are temporarily disabled by the administrator."
    };
  }
  
  return { allowed: true };
}
