import React from "react";
import styled from "styled-components";
import { Dropdown, DropdownItem } from "@eyeseetea/d2-ui-components";
import { Typography } from "@material-ui/core";
import i18n from "../../../utils/i18n";
import { NamedRef } from "../../../domain/entities/Ref";
import { Maybe } from "../../../types/utils";
import { useAppContext } from "../../contexts/app-context";

type UserGroupDescriptionSourceSelectProps = {
    value: Maybe<string>;
    onChange: (value: Maybe<string>) => void;
};

export const UserGroupDescriptionSourceSelect: React.FC<UserGroupDescriptionSourceSelectProps> = React.memo(props => {
    const { value, onChange } = props;
    const { compositionRoot } = useAppContext();
    const [sources, setSources] = React.useState<NamedRef[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        return compositionRoot.userGroups.getDescriptionSources().run(
            sources => {
                setSources(sources);
                setIsLoading(false);
            },
            error => {
                console.error(error);
                setIsLoading(false);
            }
        );
    }, [compositionRoot.userGroups]);

    const items = React.useMemo((): DropdownItem[] => {
        return sources.map(source => ({ value: source.id, text: source.name }));
    }, [sources]);

    const hasNoSources = !isLoading && sources.length === 0;

    /* The attribute may have been deleted in DHIS2 after being configured here: the dropdown
     * shows an empty value and the description column stays empty, so warn about it. */
    const isSourceMissing = !isLoading && !!value && !sources.some(source => source.id === value);

    return (
        <Container>
            <Dropdown
                items={items}
                label={i18n.t("User group description")}
                onChange={onChange}
                value={value ?? undefined}
            />
            {isSourceMissing && (
                <Typography variant="caption" color="error">
                    {i18n.t(
                        "The configured attribute no longer exists in this instance. Select another one or the Description column will stay empty."
                    )}
                </Typography>
            )}
            <Typography variant="caption">
                {hasNoSources
                    ? i18n.t(
                          "This instance has no attributes for user groups. Create one in the Maintenance app to be able to show descriptions."
                      )
                    : i18n.t("Attribute used as the description of a user group. Without one, the column is hidden.")}
            </Typography>
        </Container>
    );
});

const Container = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    max-width: 30em;
    padding-block-end: 1.5em;
    position: relative;
`;
