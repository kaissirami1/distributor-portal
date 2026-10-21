import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

// Wraps every public page with the background, top menu, and footer.
// Folders in parentheses like (website) don't show up in the web address.
export default function WebsiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top_left,#7a5a2a_0%,#2a2112_28%,#090806_65%,#000_100%)]">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
