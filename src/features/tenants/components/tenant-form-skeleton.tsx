import {
  FormPageSkeleton,
  FormSectionSkeleton,
  TextareaSkeleton,
} from '@/shared/components/form-skeleton';

/** Mirrors TenantForm: Contact + Emergency contact + Notes cards. */
export function TenantFormSkeleton() {
  return (
    <FormPageSkeleton>
      <FormSectionSkeleton titleWidth="w-24" cols={2} fields={5} />
      <FormSectionSkeleton titleWidth="w-40" cols={3} fields={3} />
      <FormSectionSkeleton titleWidth="w-16" fields={0} footer={<TextareaSkeleton />} />
    </FormPageSkeleton>
  );
}
