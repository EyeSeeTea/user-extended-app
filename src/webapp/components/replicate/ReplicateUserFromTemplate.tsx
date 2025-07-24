import React from "react";
import { Dialog, DialogTitle, DialogActions, DialogContent, Button } from "@material-ui/core";
import { InputField } from "@dhis2/ui";
import { Form, FormSpy, Field } from "react-final-form";
import i18n from "../../../locales";

import { Id } from "../../../domain/entities/Ref";
import { ReplicateTemplateProps } from "../../../domain/entities/ReplicateTemplate";
import { useReplicateUserFromTemplate } from "../../hooks/useReplicateUserFromTemplate";

interface ReplicateUserFromTemplateProps {
    userToReplicateId: Id;
    onRequestClose: () => void;
}

export const ReplicateUserFromTemplate: React.FC<ReplicateUserFromTemplateProps> = props => {
    const { userToReplicateId, onRequestClose } = props;
    const {
        replicateTitle,
        hasValidationErrors,
        isMounted,
        initialValues,
        validateTemplate,
        replicateUsers,
        handleFormStateChange,
    } = useReplicateUserFromTemplate(userToReplicateId, onRequestClose);

    return (
        <>
            {isMounted && (
                <Dialog open maxWidth="lg" fullWidth>
                    <DialogTitle>{replicateTitle}</DialogTitle>
                    <DialogContent>
                        <Form<FormValues>
                            onSubmit={replicateUsers}
                            initialValues={initialValues}
                            validate={validateTemplate}
                            autocomplete="off"
                            render={({ handleSubmit }) => (
                                <>
                                    <FormSpy onChange={handleFormStateChange} />

                                    <form id="replicate-form" onSubmit={handleSubmit}>
                                        <DialogContent>
                                            <RenderFormField name="replicateCount" label="Number of users to create" />
                                            <RenderFormField
                                                name="usernameTemplate"
                                                label="Username template"
                                                helpText={i18n.t(
                                                    "Using $index is optional if only one replica is created. Multiple $index placeholders can be used anywhere in the fields."
                                                )}
                                            />
                                            <RenderFormField
                                                name="passwordTemplate"
                                                label="Password template"
                                                helpText={i18n.t(
                                                    "Please ensure to copy the password and adhere to security guidelines. Using $index is optional."
                                                )}
                                            />
                                        </DialogContent>
                                    </form>
                                </>
                            )}
                        />
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={onRequestClose}>{i18n.t("Cancel")}</Button>
                        <Button disabled={hasValidationErrors} type="submit" form="replicate-form" color="primary">
                            {i18n.t("Replicate")}
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </>
    );
};

const RenderFormField: React.FC<FormFieldProps> = ({ name, label, helpText }) => {
    return (
        <Field name={name}>
            {({ input, meta }) => (
                <RenderInputField
                    label={label}
                    value={input.value}
                    setValue={input.onChange}
                    error={meta.error}
                    helpText={helpText}
                />
            )}
        </Field>
    );
};

const RenderInputField: React.FC<InputFieldProps> = ({ label, value, setValue, error, helpText }) => {
    const handleChange = (data: { value?: string }) => {
        const newValue = data.value || "";
        setValue(newValue);
    };

    return (
        <InputField
            label={label}
            value={value}
            onChange={handleChange}
            validationText={error}
            error={!!error}
            helpText={helpText}
        />
    );
};

type FormFieldLabels = "Number of users to create" | "Username template" | "Password template";
type FormValues = ReplicateTemplateProps;

interface FormFieldProps {
    name: string;
    label: FormFieldLabels;
    helpText?: string;
}

interface InputFieldProps {
    label: FormFieldLabels;
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>;
    error: string | undefined;
    helpText?: string;
}

export default ReplicateUserFromTemplate;
