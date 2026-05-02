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
                className="max-w-[min(100%-2rem,400px)] gap-5 rounded-[12px] border border-[#ebedee] bg-white p-6 shadow-lg sm:max-w-[400px]"
            >
                <DialogHeader className="gap-2 text-left">
                    <DialogTitle className="font-['Satoshi',sans-serif] text-[18px] font-semibold leading-snug text-[#0b191f]">
                        Leave AI Project Planner?
                    </DialogTitle>
                    <DialogDescription className="font-['Inter',sans-serif] text-[14px] font-normal leading-[22px] text-[#727d83]">
                        If you leave, your in-progress chat and any plan you have not finished will
                        be lost. This cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-[8px] border-[#ebedee] bg-white font-['Satoshi',sans-serif] text-[14px] font-medium text-[#0b191f] hover:bg-[#f9fafb]"
                        onClick={() => onOpenChange(false)}
                    >
                        Stay
                    </Button>
                    <Button
                        type="button"
                        className="h-10 rounded-[8px] bg-[#0b191f] font-['Satoshi',sans-serif] text-[14px] font-medium text-white hover:bg-[#1a2d38]"
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
