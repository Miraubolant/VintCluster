"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive" | "warning";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

const VARIANT_STYLES = {
  default: {
    icon: Info,
    iconClass: "text-indigo-600",
    buttonClass: "bg-indigo-600 hover:bg-indigo-700",
  },
  destructive: {
    icon: Trash2,
    iconClass: "text-red-600",
    buttonClass: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-600",
    buttonClass: "bg-amber-600 hover:bg-amber-700",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const styles = VARIANT_STYLES[variant];
  const Icon = styles.icon;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error in confirm action:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = loading || isLoading;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn("p-2 rounded-full bg-gray-100", variant === "destructive" && "bg-red-100", variant === "warning" && "bg-amber-100")}>
              <Icon className={cn("h-5 w-5", styles.iconClass)} />
            </div>
            <div className="flex-1">
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDisabled}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isDisabled}
            className={cn(styles.buttonClass, "text-white")}
          >
            {isDisabled && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook pour gérer facilement un dialog de confirmation
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "destructive" | "warning";
    onConfirm: () => void | Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    variant: "default",
    onConfirm: () => {},
  });

  const confirm = (options: {
    title: string;
    description: string;
    variant?: "default" | "destructive" | "warning";
    onConfirm: () => void | Promise<void>;
  }) => {
    setState({
      open: true,
      title: options.title,
      description: options.description,
      variant: options.variant || "default",
      onConfirm: options.onConfirm,
    });
  };

  const close = () => {
    setState((prev) => ({ ...prev, open: false }));
  };

  return {
    dialogProps: {
      open: state.open,
      onOpenChange: (open: boolean) => setState((prev) => ({ ...prev, open })),
      title: state.title,
      description: state.description,
      variant: state.variant,
      onConfirm: state.onConfirm,
    },
    confirm,
    close,
  };
}
