import { Button } from "@/components/ui/button";
import { WHATSAPP_MESSAGE } from "@/components/ShareCard";
import FeedbackForm from "@/components/FeedbackForm";

export default function AppFooter() {
  const handleInvite = () => {
    window.location.href = `whatsapp://send?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  };

  return (
    <footer className="mt-10 border-t bg-white/80">
      <div className="container mx-auto grid gap-6 px-4 py-8 md:grid-cols-2">
        <div className="space-y-3 text-sm text-slate-700">
          <p>Copyright @2026 | Founder: Korede Omotosho</p>
          <p>Powered by Aurikrex</p>
          <Button variant="outline" onClick={handleInvite}>
            Invite Friends
          </Button>
        </div>
        <FeedbackForm />
      </div>
    </footer>
  );
}
