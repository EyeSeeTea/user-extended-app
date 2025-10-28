import _ from "lodash";
import { FontIcon, RaisedButton } from "material-ui";

import React, { useState, useEffect, useCallback, ComponentType } from "react";

import InfoDialog from "../../../legacy/components/InfoDialog";
import i18n from "../../../utils/i18n";
import { useLoading, useSnackbar } from "@eyeseetea/d2-ui-components";
import {
    TableRow,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableContainer,
    Tooltip,
    Switch,
    FormControlLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
} from "@material-ui/core";
import { IconButton, Chip } from "material-ui";
import { Form, FormSpy, useForm, Field } from "react-final-form";
import { FormState } from "final-form";
import { defaultUserProps, UserProps } from "../../../domain/entities/UserProps";
import { ColumnSelectorDialog } from "../column-selector-dialog/ColumnSelectorDialog";
import { UserFormField, getUserFieldName, userFormFields } from "../user-form/utils";
import { UserRoleGroupFF } from "../user-form/components/UserRoleGroupFF";
import { OrgUnitSelectorFF } from "../user-form/components/OrgUnitSelectorFF";
import { PreviewInputFF } from "../form/fields/PreviewInputFF";
import styled from "styled-components";
import { FormFieldProps } from "../form/fields/FormField";
import { useGetAllUserIdentifiers } from "../../hooks/userHooks";
import { Maybe } from "../../../types/utils";
import { useAppContext } from "../../contexts/app-context";
import { ImportUser } from "../../../domain/entities/ImportUser";
import { Username } from "../../../domain/value-objects/Username";
import { Password } from "../../../domain/value-objects/Password";
import { Email } from "../../../domain/value-objects/Email";
import { validateRequired } from "../../../domain/utils/validations";
import { UserIdentifier } from "../../../domain/entities/UserIdentifier";

const columnNameFromPropertyMapping: Record<Columns, string> = {
    id: "ID",
    username: "Username",
    password: "Password",
    firstName: "First name",
    surname: "Surname",
    email: "Email",
    phoneNumber: "Phone number",
    openId: "Open ID",
    userRoles: "Roles",
    userGroups: "Groups",
    organisationUnits: "OUCapture",
    dataViewOrganisationUnits: "OUOutput",
    searchOrganisationsUnits: "OUSearch",
    disabled: "Disabled",
};

export type Columns =
    | "id"
    | "username"
    | "password"
    | "firstName"
    | "surname"
    | "email"
    | "phoneNumber"
    | "openId"
    | "userRoles"
    | "userGroups"
    | "organisationUnits"
    | "dataViewOrganisationUnits"
    | "searchOrganisationsUnits"
    | "disabled";

type ImportTableProps = {
    title: string;
    usersFromFile: UserProps[];
    columns: Columns[];
    onSave?: (users: UserProps[]) => void;
    onSubmit?: (params: { users: UserProps[] }) => void;
    onRequestClose: () => void;
    templateUser?: UserProps;
    actionText: string;
    warnings: string[];
    onlyUsersOrgUnits: boolean;
};

export const ImportTable: React.FC<ImportTableProps> = props => {
    const {
        title,
        usersFromFile,
        columns: baseUserColumns,
        onSave,
        onRequestClose,
        templateUser = null,
        actionText,
        warnings = [],
        onlyUsersOrgUnits,
        onSubmit: customOnSubmit,
    } = props;
    const [users, setUsers] = useState<UserProps[]>(usersFromFile);
    const [existingUserIdentifiers, setExistingUserIdentifiers] = React.useState<UserIdentifier[]>([]);
    const [existingUsersNames, setExistingUsersNames] = React.useState<string[]>([]);

    const [infoDialog, setInfoDialog] = React.useState<{ response: string }>();
    const [isLoading, setIsLoading] = React.useState(true);

    const [allowOverwrite, setAllowOverwrite] = React.useState(false);
    const [showOverwriteToggle, setShowOverwriteToggle] = React.useState(true);

    // Add a blank column to the end for delete buttons
    const [columns, setColumns] = useState<(Columns | "")[]>([...baseUserColumns, ""]);
    const [columnSelectorOpen, setColumnSelectorOpen] = useState<boolean>(false);

    const [errorsCount, setErrorsCount] = React.useState(0);
    const [areUsersValid, setAreUsersValid] = React.useState(false);

    const randomPassword = React.useMemo(() => {
        return Password.generate().value;
    }, []);

    const { compositionRoot } = useAppContext();
    const snackbar = useSnackbar();

    const loading = useLoading();

    const { userIdentifiers } = useGetAllUserIdentifiers(onlyUsersOrgUnits);
    useEffect(() => {
        loading.show(true);

        const fetchData = () => {
            setIsLoading(true);
            if (!userIdentifiers) {
                return;
            }
            setExistingUserIdentifiers(userIdentifiers);
            setExistingUsersNames(userIdentifiers.map(user => user.username));
            setIsLoading(false);
            loading.reset();
        };

        fetchData();
    }, [userIdentifiers, loading]);

    const existingUserInTable = useCallback(
        (newUsers: UserProps[]) => {
            if (!existingUsersNames) {
                return false;
            }
            return _(newUsers).some(user => existingUsersNames.includes(user.username));
        },
        [existingUsersNames]
    );

    const closeInfoDialog = () => {
        setInfoDialog(undefined);
    };

    const toggleAllowOverwrite = useCallback(
        (_event, newValue: boolean, form) => {
            requestAnimationFrame(() => {
                form.change("updateValidation", newValue);
            });
            setAreUsersValid(newValue || !errorsCount);
            setAllowOverwrite(newValue);
        },
        [errorsCount]
    );

    const renderDialogTitle = () => {
        const errorText =
            errorsCount === 0
                ? null
                : i18n.t("{{n}} invalid users found, check in-line errors in table", { n: errorsCount });
        const maxWarnings = 10;
        const hiddenWarnings = Math.max(warnings.length - maxWarnings, 0);

        const warningText =
            warnings.length === 0
                ? null
                : _([
                      i18n.t("{{n}} warning(s) while importing file", { n: warnings.length }) + ":",
                      ..._(warnings)
                          .take(maxWarnings)
                          .map((line, idx) => `${idx + 1}. ${line}`)
                          .value(),
                      hiddenWarnings > 0 ? i18n.t("[... and {{n}} more warning(s) ...]", { n: hiddenWarnings }) : null,
                  ])
                      .compact()
                      .join("\n");

        return (
            <React.Fragment>
                {title}
                {errorText && (
                    <DialogTooltip title={errorText}>
                        <FontIcon className="material-icons">error</FontIcon>
                    </DialogTooltip>
                )}
                {warningText && (
                    <DialogTooltip title={warningText}>
                        <FontIcon className="material-icons">warning</FontIcon>
                    </DialogTooltip>
                )}
            </React.Fragment>
        );
    };

    const defaultOnSubmit = useCallback(
        ({ users }: { users: UserProps[] }) => {
            loading.show(true, i18n.t("Importing users"));
            return compositionRoot.users.import({ users }).run(
                () => {
                    onRequestClose();
                    loading.hide();
                    if (onSave) {
                        onSave([]);
                    }
                    snackbar.success(i18n.t("Users imported successfully"));
                },
                error => {
                    loading.hide();
                    snackbar.error(error);
                }
            );
        },
        [loading, onRequestClose, onSave, snackbar, compositionRoot.users]
    );

    const onSubmit = customOnSubmit || defaultOnSubmit;

    const defaultAddRow = useCallback(
        (currentUsers: UserProps[]) => {
            const newUser: UserProps = {
                ...defaultUserProps,
                username: "",
                password: randomPassword,
                userRoles: [],
                userGroups: [],
            };
            setUsers(currentUsers.concat(newUser));
        },
        [randomPassword]
    );

    const replicateAddRow = useCallback(
        (currentUsers: UserProps[]) => {
            if (templateUser) {
                const existingNames = existingUsersNames.concat(currentUsers.map(user => user.username));
                const makeUsername = (i = 0) => `${templateUser.username}_${i}`;
                const index = _.range(1, 1000).find(i => !existingNames.some(username => username === makeUsername(i)));
                const newUser = {
                    ...templateUser,
                    username: makeUsername(index),
                    password: randomPassword,
                };
                setUsers(currentUsers.concat(newUser));
            }
        },
        [existingUsersNames, randomPassword, templateUser]
    );

    const addRow = templateUser ? replicateAddRow : defaultAddRow;

    const renderTableRow = useCallback(
        (user: UserProps, rowIndex: number, users: UserProps[]) => {
            const currentUsername = users[rowIndex]?.username || user.username;
            const existingUser = existingUserIdentifiers.find(u => u.username === currentUsername);
            const chipTitle = existingUser
                ? i18n.t("User already exists: {{id}}", { id: existingUser.id, nsSeparator: false })
                : "";
            const chipText = (rowIndex + 1).toString() + (existingUser ? "-E" : "");
            const duplicateUsernames = findDuplicatesInUsernames(users);
            return (
                <StyledTableRow key={rowIndex} $isError={!allowOverwrite && !!existingUser}>
                    <StyledTableCell>
                        <Tooltip title={chipTitle}>
                            <StyledChipExistingUser $isError={!!existingUser}>{chipText}</StyledChipExistingUser>
                        </Tooltip>
                    </StyledTableCell>

                    {columns.map((value: string, columnIndex: number) => (
                        <StyledTableCell key={`${rowIndex}-${columnIndex}-${value}`}>
                            <RowItem
                                key={`${rowIndex}-${columnIndex}-${value}`}
                                rowIndex={rowIndex}
                                columnIndex={columnIndex}
                                data={{ columns, duplicateUsernames, existingUsersNames }}
                                onDelete={users => setUsers(users)}
                                allowOverwrite={allowOverwrite}
                            />
                        </StyledTableCell>
                    ))}
                </StyledTableRow>
            );
        },
        [columns, existingUserIdentifiers, existingUsersNames, allowOverwrite]
    );

    const updateFormState = ({ values: { users: updatedUsers }, errors }: FormState<{ users: UserProps[] }>) => {
        setErrorsCount(errors?.users?.length || 0);
        setAreUsersValid(_.isEmpty(errors?.users));
        setShowOverwriteToggle(existingUserInTable(updatedUsers));
    };

    return (
        <Dialog open maxWidth="lg" fullWidth>
            <StyledDialogTitle>{renderDialogTitle()}</StyledDialogTitle>
            <DialogContent>
                {!isLoading && (
                    <div>
                        {columnSelectorOpen && (
                            <ColumnSelectorDialog
                                columns={userFormFields}
                                visibleColumns={columns}
                                onChange={columns => setColumns(columns as Columns[])}
                                getName={getUserFieldName}
                                onCancel={() => setColumnSelectorOpen(false)}
                            />
                        )}
                        <TableContainer>
                            <Form<{ users: UserProps[] }>
                                autocomplete="off"
                                onSubmit={onSubmit}
                                initialValues={{ users }}
                                render={({ handleSubmit, form, values }) => {
                                    const canAddNewUser = values.users.length < ImportUser.MAX_USERS;
                                    return (
                                        <>
                                            <FormSpy
                                                onChange={(state: FormState<{ users: UserProps[] }>) => {
                                                    requestAnimationFrame(() => {
                                                        updateFormState(state);
                                                    });
                                                }}
                                            />

                                            <form id="import-form" onSubmit={handleSubmit}>
                                                <Table stickyHeader={true}>
                                                    <TableHead>
                                                        <TableRow>
                                                            <StyledTableColumn>#</StyledTableColumn>
                                                            {columns.map((header: string) => (
                                                                <StyledTableCellHeader key={header}>
                                                                    {columnNameFromPropertyMapping[header as Columns] ||
                                                                        header}
                                                                </StyledTableCellHeader>
                                                            ))}
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {_.map(users, (user: UserProps, rowIndex: string) =>
                                                            renderTableRow(user, Number(rowIndex), values.users)
                                                        )}
                                                    </TableBody>
                                                </Table>

                                                <AddButtonRow>
                                                    <RaisedButton
                                                        disabled={!canAddNewUser}
                                                        label={i18n.t("Add user")}
                                                        onClick={() => {
                                                            const currentUsers = form.getState().values.users;
                                                            addRow(currentUsers);
                                                        }}
                                                    />
                                                </AddButtonRow>
                                            </form>
                                            {showOverwriteToggle && !templateUser && (
                                                <FormControlLabel
                                                    control={
                                                        <Switch
                                                            checked={allowOverwrite}
                                                            onChange={(event, newValue) =>
                                                                toggleAllowOverwrite(event, newValue, form)
                                                            }
                                                        />
                                                    }
                                                    label={i18n.t("Overwrite existing users")}
                                                />
                                            )}
                                        </>
                                    );
                                }}
                            />
                        </TableContainer>
                    </div>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onRequestClose}>{i18n.t("Cancel")}</Button>
                <Button disabled={_.isEmpty(users) || !areUsersValid} type="submit" form="import-form" color="primary">
                    {actionText}
                </Button>
            </DialogActions>
            {infoDialog && (
                <InfoDialog
                    t={i18n.t}
                    title={i18n.t("Error on metadata action")}
                    onClose={() => closeInfoDialog()}
                    response={infoDialog.response}
                />
            )}
        </Dialog>
    );
};

type RowItemProps = {
    data: { columns: string[]; duplicateUsernames?: DuplicateInfo; existingUsersNames: string[] };
    columnIndex: number;
    rowIndex: number;
    onDelete: (users: UserProps[]) => void;
    allowOverwrite: boolean;
};

const RowItem: React.FC<RowItemProps> = ({ data, columnIndex, rowIndex, onDelete, allowOverwrite }) => {
    const form = useForm<{ users: UserProps[] }>();
    const deleteRow = columnIndex === data.columns.length - 1;
    const field = data.columns[columnIndex];
    const username = form.getState().values.users[rowIndex]?.username;
    const isExistingUser = username ? data.existingUsersNames.includes(username) : false;

    const removeRow = useCallback(() => {
        const original = form.getState().values.users;
        const users = [...original.slice(0, rowIndex), ...original.slice(rowIndex + 1)];
        onDelete(users);
    }, [form, onDelete, rowIndex]);

    if (deleteRow) {
        return (
            <StyledIconButton title={i18n.t("Remove user")} onClick={removeRow}>
                <FontIcon className="material-icons">delete</FontIcon>
            </StyledIconButton>
        );
    }

    if (!field) return null;

    return (
        <RenderUserImportField
            rowIndex={rowIndex}
            field={field}
            allowOverwrite={allowOverwrite}
            isExistingUser={isExistingUser}
            duplicateUsernames={data.duplicateUsernames}
        />
    );
};

const RenderUserImportField: React.FC<{
    rowIndex: number;
    field: UserFormField;
    allowOverwrite: boolean;
    isExistingUser: boolean;
    duplicateUsernames?: DuplicateInfo;
}> = ({ duplicateUsernames, rowIndex, field, allowOverwrite, isExistingUser }) => {
    const name = `users[${rowIndex}].${field}`;

    const { validation, props: validationProps = {} } = useValidations(field);
    const props = {
        name,
        placeholder: getUserFieldName(field),
        validate: validation,
        component: TextField,
        ...validationProps,
    };

    switch (field) {
        case "userGroups":
        case "userRoles":
        case "organisationUnits":
        case "dataViewOrganisationUnits":
        case "searchOrganisationsUnits":
            return (
                <PreviewInputFF {...props}>
                    <RenderField
                        rowIndex={rowIndex}
                        field={field}
                        allowOverwrite={allowOverwrite}
                        isExistingUser={isExistingUser}
                    />
                </PreviewInputFF>
            );
        default:
            return (
                <RenderField
                    rowIndex={rowIndex}
                    field={field}
                    allowOverwrite={allowOverwrite}
                    isExistingUser={isExistingUser}
                    duplicateUsernames={duplicateUsernames}
                />
            );
    }
};

const RenderField: React.FC<{
    rowIndex: number;
    field: UserFormField;
    allowOverwrite: boolean;
    isExistingUser: boolean;
    duplicateUsernames?: DuplicateInfo;
}> = ({ duplicateUsernames, rowIndex, field, allowOverwrite, isExistingUser }) => {
    const { validation, props: validationProps = {} } = useValidations(field, allowOverwrite, isExistingUser);
    const name = `users[${rowIndex}].${field}`;
    const props = {
        name,
        placeholder: getUserFieldName(field),
        validate: validation,
        ...validationProps,
    };

    switch (field) {
        case "firstName":
        case "surname":
        case "openId":
            return <FormTextField {...props} />;
        case "username":
            return <FormTextField {...props} duplicateUsernames={duplicateUsernames} rowIndex={rowIndex} />;
        case "password":
            return <FormTextField {...props} type="password" />;
        case "email":
            return <FormTextField {...props} type="email" />;
        case "phoneNumber":
            return <FormTextField {...props} type="tel" />;
        case "userGroups":
            return <FormFieldDialog {...props} component={UserRoleGroupFF} modelType="userGroups" />;
        case "userRoles":
            return <FormFieldDialog {...props} component={UserRoleGroupFF} modelType="userRoles" />;
        case "organisationUnits":
        case "dataViewOrganisationUnits":
        case "searchOrganisationsUnits":
            return <FormFieldDialog {...props} component={OrgUnitSelectorFF} />;
        case "disabled":
            return (
                <Field {...props} type="checkbox">
                    {fieldProps => {
                        return (
                            <Switch
                                checked={fieldProps.input.checked}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                                    return fieldProps.input.onChange(event);
                                }}
                            />
                        );
                    }}
                </Field>
            );
        default:
            return <FormTextField {...props} />;
    }
};

const FormFieldDialog = <FieldValue, T extends ComponentType<any>>(props: FormFieldProps<FieldValue, T>) => {
    return <Field<FieldValue> {...props} />;
};

function getDuplicateUsernameError(options: { duplicate: DuplicateInfo; rowIndex?: number }): string {
    if (options.rowIndex === undefined) return "";
    const { duplicate, rowIndex } = options;
    return duplicate.indexes.includes(rowIndex)
        ? i18n.t("Duplicated username: {{username}}", { nsSeparator: false, username: duplicate.duplicateValue })
        : "";
}

const FormTextField = (props: FormTextFieldProps) => {
    return (
        <Field {...props}>
            {fieldProps => {
                const validationErrorMessage = props.validate ? props.validate(fieldProps.input.value) : "";
                const duplicateUserNameErrorMessage = props.duplicateUsernames
                    ? getDuplicateUsernameError({ duplicate: props.duplicateUsernames, rowIndex: props.rowIndex })
                    : "";
                const thereIsAnError = Boolean(validationErrorMessage) || fieldProps.meta.error;
                const onChose = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
                    return fieldProps.input.onChange(event);
                };
                return (
                    <div>
                        <TextField
                            name={fieldProps.input.name}
                            value={fieldProps.input.value}
                            onChange={onChose}
                            error={duplicateUserNameErrorMessage.length > 0 || thereIsAnError}
                            helperText={duplicateUserNameErrorMessage || validationErrorMessage}
                        />
                    </div>
                );
            }}
        </Field>
    );
};

const useValidations = (
    field: UserFormField,
    allowOverwrite = false,
    isExistingUser = false
): { validation?: (...args: any[]) => Maybe<string>; props?: object } => {
    switch (field) {
        case "username": {
            return {
                validation: (value: string) => {
                    if (allowOverwrite && isExistingUser) return "";
                    if (isExistingUser) {
                        return i18n.t("User already exists");
                    }

                    const usernameResult = Username.create(value);

                    if (usernameResult.isError()) {
                        const error = usernameResult.value.error[0] || "";
                        return i18n.t(error);
                    }

                    return undefined;
                },
            };
        }
        case "email":
            return {
                validation: (value: string) => {
                    if (value) {
                        const emailResult = Email.create(value);

                        if (emailResult.isError()) {
                            const error = emailResult.value.error[0] || "";
                            return i18n.t(error);
                        }
                    }
                    return undefined;
                },
            };
        case "password":
            return {
                validation: (value: string) => {
                    const passwordResult = Password.create(value, isExistingUser);

                    if (passwordResult.isError()) {
                        const error = passwordResult.value.error[0] || "";
                        return i18n.t(error);
                    }

                    return undefined;
                },
            };
        case "userRoles":
        case "userGroups":
        case "organisationUnits":
            // NOTE: userGroups is not a mandatory field but its required by src/domain/usecases/ImportUsersUseCase.ts
            return {
                validation: (value: string[]) => {
                    // Make the field name singular for the error message
                    const fieldName = field.slice(0, -1);
                    const arrayFieldValidationResult = validateRequired(
                        value,
                        `Please select at least one ${fieldName}`
                    );
                    if (arrayFieldValidationResult) {
                        return i18n.t(arrayFieldValidationResult);
                    }
                    return undefined;
                },
            };
        case "firstName":
        case "surname":
            return {
                validation: (value: string) => {
                    const fieldValidationError = validateRequired(value, `${field} is required`);
                    if (fieldValidationError) {
                        return i18n.t(fieldValidationError);
                    }
                    return undefined;
                },
            };
        default: {
            return { validation: undefined };
        }
    }
};

type FormTextFieldProps = {
    name: string;
    placeholder: string;
    type?: string;
    validate?: (value: Maybe<string>) => Maybe<string>;
    duplicateUsernames?: DuplicateInfo;
    rowIndex?: number;
};

const StyledTableCellHeader = styled(TableCell)`
    width: 150px;
    font-weight: bold;
    font-size: 1.2em;
    overflow: hidden;
    white-space: nowrap;
`;

const StyledTableCell = styled(TableCell)`
    width: 150px;
`;

const StyledTableRow = styled(TableRow)<{ $isError?: boolean }>`
    border: none;
    background-color: ${({ $isError }) => ($isError ? "#fdd" : "initial")};
`;

const StyledChipExistingUser = styled(Chip)<{ $isError?: boolean }>`
    background-color: ${({ $isError }) => ($isError ? "#faa" : "#e0e0e0e0")} !important;
`;

const StyledIconButton = styled(IconButton)`
    cursor: pointer;
`;

const StyledTableColumn = styled(TableCell)`
    width: 70px;
`;

const StyledDialogTitle = styled(DialogTitle)`
    margin-block-start: 0px;
    margin-block-end: -1px;
    margin-inline: 0px;
    padding-block-start: 24px;
    padding-block-end: 20px;
    padding-inline: 24px;
    font-size: 24px;
    font-weight: bold;
    line-height: 32px;
    display: inline;
`;

const DialogTooltip = styled(Tooltip)`
    float: inline-end;
`;

const AddButtonRow = styled.div`
    margin: 20px;
    text-align: center;
`;

interface DuplicateInfo {
    indexes: number[];
    duplicateValue: string;
}

function findDuplicatesInUsernames(users: UserProps[]): DuplicateInfo | undefined {
    const groupedUsers = _(users)
        .groupBy(user => user.username)
        .pickBy(group => group.length > 1)
        .mapValues(group => group.map(item => _.findIndex(users, item)))
        .value();

    const [duplicateValue, indexes] = _.toPairs(groupedUsers)[0] || [undefined, []];
    return duplicateValue ? { indexes, duplicateValue } : undefined;
}
