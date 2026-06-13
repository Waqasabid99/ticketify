import Sidebar from "@/layout/Sidebar";

export default async function AdminLayout({ children }) {
    return (
        <div className="min-h-full flex flex-col justify-between">

            <div className="flex gap-2 w-full">
                <Sidebar />
                <div className="w-full p-2">
                    {children}
                </div>
            </div>
        </div>
    );
}
