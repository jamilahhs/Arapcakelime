import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const isProtectedPath =
    url.pathname.startsWith("/student") || url.pathname.startsWith("/teacher");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const isMockMode =
    !supabaseUrl ||
    supabaseUrl.includes("your-project") ||
    supabaseUrl.includes("placeholder");

  // ----------------------------------------------------
  // OFFLINE MOCK MODE ROUTING
  // ----------------------------------------------------
  if (isMockMode) {
    const mockRole = request.cookies.get("mock_role")?.value;
    const mockUserId = request.cookies.get("mock_user_id")?.value;

    const hasSession = !!mockUserId;

    // Redirect to login if not authenticated and trying to access protected paths
    if (isProtectedPath && !hasSession) {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (hasSession) {
      const isAuthPath =
        url.pathname === "/login" ||
        url.pathname === "/register" ||
        url.pathname === "/";

      // Redirect signed-in users from auth pages to their dashboards
      if (isAuthPath) {
        if (mockRole === "teacher") {
          url.pathname = "/teacher/classes";
        } else {
          url.pathname = "/student/overview";
        }
        return NextResponse.redirect(url);
      }

      // Protect teacher paths from student role
      if (url.pathname.startsWith("/teacher") && mockRole !== "teacher") {
        url.pathname = "/student/overview";
        return NextResponse.redirect(url);
      }

      // Protect student paths from teacher role
      if (url.pathname.startsWith("/student") && mockRole !== "student") {
        url.pathname = "/teacher/classes";
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  }

  // ----------------------------------------------------
  // ONLINE SUPABASE ROUTING
  // ----------------------------------------------------
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if user is not authenticated and trying to access protected paths
  if (isProtectedPath && !user) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // If authenticated user tries to visit login or register, redirect them to their dashboard
    const isAuthPath =
      url.pathname === "/login" ||
      url.pathname === "/register" ||
      url.pathname === "/";

    if (isAuthPath) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "teacher") {
        url.pathname = "/teacher/classes";
      } else {
        url.pathname = "/student/overview";
      }
      return NextResponse.redirect(url);
    }

    // Protect teacher dashboard from students
    if (url.pathname.startsWith("/teacher")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "teacher") {
        url.pathname = "/student/overview";
        return NextResponse.redirect(url);
      }
    }

    // Protect student dashboard from teachers
    if (url.pathname.startsWith("/student")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "student") {
        url.pathname = "/teacher/classes";
        return NextResponse.redirect(url);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
