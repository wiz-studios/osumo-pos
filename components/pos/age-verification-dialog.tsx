import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Shield } from "lucide-react"

interface AgeVerificationDialogProps {
    open: boolean
    onConfirm: () => void
    onCancel: () => void
}

export function AgeVerificationDialog({ open, onConfirm, onCancel }: AgeVerificationDialogProps) {
    return (
        <AlertDialog open={open}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                            <Shield className="h-6 w-6 text-amber-600 dark:text-amber-500" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-xl">Age Verification Required</AlertDialogTitle>
                        </div>
                    </div>
                    <AlertDialogDescription className="text-base space-y-3 pt-2">
                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                                <div className="font-medium text-amber-900 dark:text-amber-100">
                                    Customer must be 18+ years old
                                </div>
                                <div className="text-sm text-amber-700 dark:text-amber-300">
                                    Please verify a valid government-issued ID before proceeding.
                                </div>
                            </div>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            Have you confirmed the customer&apos;s age by checking their ID?
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2 sm:gap-0">
                    <AlertDialogCancel onClick={onCancel}>
                        No, Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                    >
                        Yes, ID Verified
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
