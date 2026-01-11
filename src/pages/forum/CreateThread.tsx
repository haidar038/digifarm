import { RoleBasedLayout } from "@/components/layout/RoleBasedLayout";
import { ThreadEditor } from "@/components/forum";

export default function CreateThread() {
    return (
        <RoleBasedLayout title="Buat Diskusi Baru">
            <div className="max-w-3xl mx-auto">
                <ThreadEditor />
            </div>
        </RoleBasedLayout>
    );
}
