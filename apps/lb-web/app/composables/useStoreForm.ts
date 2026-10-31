import { useMutation } from "@vue/apollo-composable";
import { provideForm, useForm } from "@vuehookform/core";
import { useToast } from "primevue/usetoast";
import { CREATE_STORE_MUTATION } from "~/api/store";
import { STORE } from "~/constants/store";
import { createStoreDefaultValues, createStoreSchema } from "~/schemas/store";
import type { CreateStoreMutation, CreateStoreVariables } from "~/types/store";
import { getGraphqlErrorDetails } from "~/utils/graphql";

// The form's fields read their value and error from the form given to provideForm.
// onCreated runs once the API has created the store; a refusal keeps the form open with the reason shown.
export const useStoreForm = ({ onCreated }: { onCreated: () => unknown }) => {
  const { t } = useTranslate();
  const toast = useToast();
  // Validate on submit, then on every edit so a fixed field loses its error at once. The library
  // documents onChange as the default for reValidateMode but does not apply it, so it is set here.
  const form = useForm({
    schema: createStoreSchema,
    defaultValues: createStoreDefaultValues,
    reValidateMode: "onChange",
  });
  const hasExistingStoreError = ref(false);
  const { mutate } = useMutation<CreateStoreMutation, CreateStoreVariables>(CREATE_STORE_MUTATION);

  provideForm(form);

  const showCreateError = (error: unknown) => {
    const { code, fields } = getGraphqlErrorDetails(error);

    if (fields.length) {
      // An error message is the API error code; StoreFormField maps it to text.
      form.setErrors(Object.fromEntries(fields.map(({ field, code: fieldCode }) => [field, fieldCode] as const)));
      return;
    }

    if (code === STORE.ERROR_CODE.ALREADY_EXISTS) {
      hasExistingStoreError.value = true;
      return;
    }

    toast.add({
      severity: "error",
      summary: t("storeError.title"),
      detail: t("storeError.save"),
      life: 5000,
    });
  };

  const onSubmit = form.handleSubmit(async (values) => {
    hasExistingStoreError.value = false;

    try {
      await mutate({ input: values });
    } catch (error: unknown) {
      showCreateError(error);
      return;
    }

    await onCreated();
  });

  return { onSubmit, hasExistingStoreError };
};
