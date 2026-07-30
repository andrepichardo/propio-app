import {
  FormPageSkeleton,
  FormSectionSkeleton,
  SwitchRowSkeleton,
  TextareaSkeleton,
} from '@/shared/components/form-skeleton';

/** Mirrors ContractForm: Parties + Terms cards. Shared by new & edit. */
export function ContractFormSkeleton() {
  return (
    <FormPageSkeleton>
      <FormSectionSkeleton titleWidth="w-20" cols={2} fields={2} />
      <FormSectionSkeleton
        titleWidth="w-24"
        cols={2}
        fields={7}
        footer={
          <>
            <SwitchRowSkeleton />
            <TextareaSkeleton />
          </>
        }
      />
    </FormPageSkeleton>
  );
}
