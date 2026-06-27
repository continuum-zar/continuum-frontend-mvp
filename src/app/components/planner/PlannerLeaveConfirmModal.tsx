import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';

/** Parent wraps pending navigation; user must confirm in {@link PlannerLeaveConfirmModal}. */
export type PlannerNavigateAwayRequest = (proceed: () => void) => void;

export type PlannerNavigationGuardProps = {
    requestNavigate: (proceed: () => void) => void;
};

type PlannerLeaveConfirmModalProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirmLeave: () => void;
};

export function PlannerLeaveConfirmModal({
    open,
    onOpenChange,
    onConfirmLeave,
}: PlannerLeaveConfirmModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                hideClose
                className="max-w-[min(100%-2rem,400px)] gap-5 rounded-[12px] border border-border bg-card p-6 shadow-lg sm:max-w-[400px]"
            >
                <DialogHeader className="gap-2 text-left">
                    <DialogTitle className="font-['Satoshi',sans-serif] text-[18px] font-semibold leading-snug text-foreground">
                        Leave AI Project Planner?
                    </DialogTitle>
                    <DialogDescription className="font-['Inter',sans-serif] text-[14px] font-normal leading-[22px] text-muted-foreground">
                        If you leave, your in-progress chat and any plan you have not finished will
                        be lost. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-[8px] border-border bg-card font-['Satoshi',sans-serif] text-[14px] font-medium text-foreground hover:bg-muted"
                        onClick={() => onOpenChange(false)}
                    >
                        Stay
                    </Button>
                    <Button
                        type="button"
                        className="h-10 rounded-[8px] bg-foreground font-['Satoshi',sans-serif] text-[14px] font-medium text-background hover:bg-foreground/90"
                        onClick={() => {
                            onConfirmLeave();
                            onOpenChange(false);
                        }}
                    >
                        Leave
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
