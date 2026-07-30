import { Skeleton } from '@/shared/components/ui/skeleton';
import {
  FormPageSkeleton,
  FormSectionSkeleton,
  SwitchRowSkeleton,
  TextareaSkeleton,
} from '@/shared/components/form-skeleton';

/** Mirrors PaymentForm: single Payment card (fields, deposit/email toggles,
 * notes and proof upload). */
export function PaymentFormSkeleton() {
  return (
    <FormPageSkeleton>
      <FormSectionSkeleton
        titleWidth="w-24"
        cols={2}
        fields={6}
        footer={
          <>
            <SwitchRowSkeleton />
            <TextareaSkeleton />
            {/* Proof drop area */}
            <Skeleton className="h-28 w-full rounded-lg" />
            <SwitchRowSkeleton />
          </>
        }
      />
    </FormPageSkeleton>
  );
}
