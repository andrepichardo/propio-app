import {
  FormPageSkeleton,
  FormSectionSkeleton,
  SwitchRowSkeleton,
  TextareaSkeleton,
} from '@/shared/components/form-skeleton';

/** Mirrors PropertyForm: Details + Features + Location cards. */
export function PropertyFormSkeleton() {
  return (
    <FormPageSkeleton>
      <FormSectionSkeleton
        titleWidth="w-24"
        cols={2}
        fields={3}
        footer={<TextareaSkeleton />}
      />
      <FormSectionSkeleton
        titleWidth="w-32"
        cols={3}
        fields={5}
        footer={
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <SwitchRowSkeleton key={i} />
            ))}
          </div>
        }
      />
      <FormSectionSkeleton titleWidth="w-24" cols={2} fields={5} />
    </FormPageSkeleton>
  );
}
