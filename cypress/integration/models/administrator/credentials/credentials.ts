import {
    click,
    clickByText,
    inputText,
    performRowAction,
    selectUserPerspective,
    selectItemsPerPage,
    notExists,
    exists,
    validateValue,
} from "../../../../utils/utils";
import {
    administrator,
    button,
    credentials,
    deleteAction,
    editAction,
    SEC,
    trTag,
} from "../../../types/constants";
import {
    createBtn,
    credentialNameInput,
    credLabels,
    descriptionInput,
} from "../../../views/credentials.view";
import {
    navLink,
    closeNotification,
    confirmButton,
    cancelButton,
} from "../../../views/common.view";
import { selectType } from "../../../views/credentials.view";
import * as commonView from "../../../views/common.view";
import { CredentialsData } from "../../../types/types";

export class Credentials {
    name = "";
    description = "";
    static credUrl = Cypress.env("tackleUrl") + "/identities";

    constructor(name?) {
        if (name) this.name = name;
    }

    protected fillName(): void {
        inputText(credentialNameInput, this.name);
    }

    protected validateName(name: string) {
        validateValue(credentialNameInput, name);
    }

    protected fillDescription(): void {
        if (this.description != "") {
            inputText(descriptionInput, this.description);
        }
    }

    protected validateDescription(description: string) {
        validateValue(descriptionInput, description);
    }

    protected selectType(type): void {
        click(selectType);
        clickByText(button, type);
    }

    static openList(itemsPerPage = 100) {
        cy.url().then(($url) => {
            if ($url != Credentials.credUrl) {
                selectUserPerspective(administrator);
                clickByText(navLink, credentials);
            }
        });
        cy.contains("h1", "Credentials", { timeout: 120 * SEC });
        selectItemsPerPage(itemsPerPage);
    }

    static getList() {
        return new Promise<Credentials[]>((resolve) => {
            this.openList();
            let list = [];
            cy.get(commonView.appTable, { timeout: 15 * SEC })
                .find(trTag)
                .each(($row) => {
                    let name = $row.find(credLabels.name).text();
                    list.push(new Credentials(name));
                    cy.log(name);
                })
                .then(() => {
                    resolve(list);
                });
        });
    }

    create(): void {
        Credentials.openList();
        click(createBtn);
    }

    delete(toBeCanceled = false): void {
        Credentials.openList();
        performRowAction(this.name, deleteAction);
        if (toBeCanceled) {
            click(cancelButton);
            exists(this.name);
        } else {
            click(confirmButton);
            notExists(this.name);
        }
    }

    edit(cred: CredentialsData): void {
        Credentials.openList();
        performRowAction(this.name, editAction);
    }

    protected closeSuccessNotification(): void {
        click(closeNotification);
    }
}
