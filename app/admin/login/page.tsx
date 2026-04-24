import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default function AdminLoginPage() {
    async function login(formData: FormData) {
        "use server";

        const username = formData.get("username");
        const password = formData.get("password");

        if (
            username === process.env.ADMIN_USERNAME &&
            password === process.env.ADMIN_PASSWORD
        ) {
            const cookieStore = await cookies();

            cookieStore.set("admin-auth", "true", {
                httpOnly: true,
                path: "/",
            });

            redirect("/admin/submissions");
        }

        redirect("/admin/login");
    }

    return (
        <div className="p-10 max-w-md">
            <h1 className="text-2xl font-bold mb-6">Admin Login</h1>

            <form action={login} className="flex flex-col gap-4">
                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    className="border p-2 bg-transparent"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Admin password"
                    className="border p-2 bg-transparent"
                />

                <button className="bg-white text-black p-2 rounded">
                    Login
                </button>
            </form>
        </div>
    );
}