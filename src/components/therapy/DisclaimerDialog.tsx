
import Link from "next/link";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ShieldAlert } from "lucide-react"

type DisclaimerDialogProps = {
    onAgree: () => void;
}

export default function DisclaimerDialog({ onAgree }: DisclaimerDialogProps) {
    return (
        <AlertDialog open={true}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-primary" />
                        Important Disclaimer
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="pt-4 space-y-3 text-sm text-muted-foreground text-left">
                            <p>
                                MindBud offers AI-powered conversations for wellness support and is not a substitute for professional medical advice, diagnosis, or treatment.
                            </p>
                            <p>
                                This is an MVP and the AI may produce inaccurate or unintended information. It is not intended for use in crisis situations.
                            </p>
                            <p>
                                If you are in a crisis, please contact a local emergency service immediately.
                            </p>
                            <p className="pt-2 text-xs">
                                By clicking "I Understand and Agree," you confirm that you have read and agree to our{" "}
                                <Link href="/terms-of-service" target="_blank" className="underline text-primary hover:text-primary/80">
                                    Terms of Service
                                </Link>.
                            </p>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={onAgree}>
                        I Understand and Agree
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
