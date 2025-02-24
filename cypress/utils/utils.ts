/*
Copyright © 2021 the Konveyor Contributors (https://konveyor.io/)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
import { BusinessServices } from "../integration/models/developer/controls/businessservices";
import { Stakeholders } from "../integration/models/developer/controls/stakeholders";
import { Stakeholdergroups } from "../integration/models/developer/controls/stakeholdergroups";
import { Tag } from "../integration/models/developer/controls/tags";
import { TagType } from "../integration/models/developer/controls/tagtypes";
import { Jobfunctions } from "../integration/models/developer/controls/jobfunctions";

import * as loginView from "../integration/views/login.view";
import * as commonView from "../integration/views/common.view";
import { navMenu } from "../integration/views/menu.view";
import * as data from "../utils/data_utils";
import "cypress-file-upload";
import {
    businessService,
    tag,
    groupCount,
    memberCount,
    tagCount,
    tdTag,
    trTag,
    button,
    rank,
    criticality,
    priority,
    confidence,
    deleteAction,
    applicationInventory,
    SEC,
    CredentialType,
} from "../integration/types/constants";
import {
    actionButton,
    applicationBusinessServiceSelect,
    date,
    selectBox,
} from "../integration/views/applicationinventory.view";
import {
    confirmButton,
    divHeader,
    firstPageButton,
    lastPageButton,
    modal,
    nextPageButton,
    pageNumInput,
    prevPageButton,
} from "../integration/views/common.view";
import { tagLabels } from "../integration/views/tags.view";
import { Credentials } from "../integration/models/administrator/credentials/credentials";
import { Assessment } from "../integration/models/developer/applicationinventory/assessment";
import { analysisData, applicationData } from "../integration/types/types";
import { CredentialsProxy } from "../integration/models/administrator/credentials/credentialsProxy";
import { getRandomCredentialsData } from "../utils/data_utils";
import { CredentialsMaven } from "../integration/models/administrator/credentials/credentialsMaven";
import { CredentialsSourceControlUsername } from "../integration/models/administrator/credentials/credentialsSourceControlUsername";
import { CredentialsSourceControlKey } from "../integration/models/administrator/credentials/credentialsSourceControlKey";
import { Application } from "../integration/models/developer/applicationinventory/application";

const userName = Cypress.env("user");
const userPassword = Cypress.env("pass");
const tackleUiUrl = Cypress.env("tackleUrl");
const { _ } = Cypress;

export function inputText(fieldId: string, text: any): void {
    cy.get(fieldId).click().focused().clear();
    cy.wait(200);
    cy.get(fieldId).clear().type(text);
}

export function clearInput(fieldID: string): void {
    cy.get(fieldID).clear();
}

export function clickByText(fieldId: string, buttonText: string, isForced = true): void {
    // https://github.com/cypress-io/cypress/issues/2000#issuecomment-561468114
    cy.contains(fieldId, buttonText, { timeout: 120 * SEC }).click({ force: isForced });
    cy.wait(1000);
}

export function click(fieldId: string, isForced = true): void {
    cy.get(fieldId, { timeout: 120 * SEC }).click({ force: isForced });
}

export function submitForm(): void {
    cy.get(commonView.submitButton).should("not.be.disabled");
    cy.get(commonView.controlsForm).submit();
}

export function cancelForm(): void {
    cy.get(commonView.cancelButton).click();
}

export function login(): void {
    cy.visit(tackleUiUrl, { timeout: 120 * SEC });

    inputText(loginView.userNameInput, userName);
    inputText(loginView.userPasswordInput, userPassword);
    click(loginView.loginButton);

    // Change password screen which appears only for first login
    // This is used in PR tester and Jenkins jobs.
    cy.get("h1", { timeout: 120 * SEC }).then(($a) => {
        if ($a.text().toString().trim() == "Update password") {
            inputText(loginView.changePasswordInput, "Dog8code");
            inputText(loginView.confirmPasswordInput, "Dog8code");
            click(loginView.submitButton);
        }
    });
    cy.get("h1", { timeout: 15 * SEC }).contains("Application inventory");
}

export function logout(): void {
    clickByText(button, userName);
    cy.wait(500);
    clickByText("a", "Logout");
    cy.wait(4000);
    cy.get("h1", { timeout: 15 * SEC }).contains("Log in to your account");
}

export function selectItemsPerPage(items: number): void {
    cy.get(commonView.itemsPerPageMenu, { timeout: 120 * SEC })
        .find(commonView.itemsPerPageToggleButton)
        .then(($toggleBtn) => {
            if (!$toggleBtn.eq(0).is(":disabled")) {
                $toggleBtn.eq(0).trigger("click");
                cy.get(commonView.itemsPerPageMenuOptions);
                cy.get(`li > button[data-action="per-page-${items}"]`).click({ force: true });
                cy.wait(0.5 * SEC);
            }
        });
}

export function selectFormItems(fieldId: string, item: string): void {
    cy.get(fieldId).click();
    cy.contains("button", item).click();
}

export function selectReactFormItems(
    locator: string,
    item: string,
    formId?: string,
    fieldId?: string
): void {
    if (!formId) {
        formId = "FormGroup";
    }
    if (!fieldId) {
        fieldId = "fieldId";
    }
    cy.waitForReact();
    cy.react(formId, { props: { fieldId: locator } }).click();
    cy.contains("button", item).click();
}

export function checkSuccessAlert(fieldId: string, message: string): void {
    cy.get(fieldId).should("contain.text", message);
}

export function removeMember(memberName: string): void {
    cy.get("span").contains(memberName).siblings(commonView.removeButton).click();
}

export function exists(value: string): void {
    // Wait for DOM to render table and sibling elements
    cy.get(commonView.appTable, { timeout: 5 * SEC })
        .next()
        .then(($div) => {
            if (!$div.hasClass("pf-c-empty-state")) {
                selectItemsPerPage(100);
                cy.get("td", { timeout: 10 * SEC }).should("contain", value);
            }
        });
}

export function notExists(value: string): void {
    // Wait for DOM to render table and sibling elements
    cy.get(commonView.appTable, { timeout: 5 * SEC })
        .next()
        .then(($div) => {
            if (!$div.hasClass("pf-c-empty-state")) {
                selectItemsPerPage(100);
                cy.get("table[aria-label='main-table']", { timeout: 5 * SEC }).should(
                    "not.contain",
                    value
                );
            }
        });
}

export function selectFilter(filterName: string, identifiedRisk?: boolean, value = 0): void {
    cy.get("div.pf-c-toolbar__group.pf-m-toggle-group.pf-m-filter-group.pf-m-show").within(() => {
        cy.get("div.pf-c-dropdown").eq(value).click();
        cy.get("ul.pf-c-dropdown__menu").within(() => {
            clickByText("a", filterName);
        });
    });
}

export function filterInputText(searchTextValue: string, value: number): void {
    cy.get(commonView.filterInput).eq(value).click().focused().clear();
    cy.wait(200);
    cy.get(commonView.filterInput).eq(value).clear().type(searchTextValue);
    cy.get(commonView.searchButton).eq(value).click({ force: true });
}

export function clearAllFilters(): void {
    cy.contains(button, "Clear all filters").click({ force: true });
}

export function applySelectFilter(filterId, filterName, filterText, isValid = true): void {
    selectFilter(filterName);
    click("#" + filterId + "-filter-value-select");
    inputText("input.pf-c-form-control.pf-m-search", filterText);
    if (isValid) {
        clickByText("span.pf-c-check__label", filterText);
    } else {
        cy.contains("div.pf-c-select__menu", "No results found");
    }
    click("#" + filterId + "-filter-value-select");
}

export function applySearchFilter(
    filterName: string,
    searchText: any,
    identifiedRisk?: boolean,
    value?: number
): void {
    selectFilter(filterName, identifiedRisk, value);
    if (filterName == businessService || filterName == tag) {
        cy.get("div.pf-c-input-group").find("div.pf-c-select > div > button").click();
        if (Array.isArray(searchText)) {
            searchText.forEach(function (searchTextValue) {
                cy.get("div.pf-c-select__menu > fieldset > label > span")
                    .contains(searchTextValue)
                    .click();
            });
        } else {
            cy.get("div.pf-c-select__menu > fieldset > label > span").contains(searchText).click();
        }
    } else {
        if (Array.isArray(searchText)) {
            searchText.forEach(function (searchTextValue) {
                if (identifiedRisk) {
                    filterInputText(searchTextValue, 1);
                } else {
                    filterInputText(searchTextValue, 0);
                }
            });
        } else {
            if (identifiedRisk) {
                filterInputText(searchText, 1);
            } else {
                filterInputText(searchText, 0);
            }
        }
    }
    cy.wait(4000);
}

export function sortAsc(sortCriteria: string): void {
    cy.get(`th[data-label="${sortCriteria}"]`).then(($tableHeader) => {
        if (
            $tableHeader.attr("aria-sort") === "descending" ||
            $tableHeader.attr("aria-sort") === "none"
        ) {
            $tableHeader.find("button").trigger("click");
        }
    });
}

export function sortDesc(sortCriteria: string): void {
    cy.get(`th[data-label="${sortCriteria}"]`).then(($tableHeader) => {
        if (
            $tableHeader.attr("aria-sort") === "ascending" ||
            $tableHeader.attr("aria-sort") === "none"
        ) {
            $tableHeader.find("button").trigger("click");
        }
    });
}

export function sortAscCopyAssessmentTable(sortCriteria: string): void {
    cy.get(`.pf-m-compact > thead > tr > th[data-label="${sortCriteria}"]`).then(($tableHeader) => {
        if (
            $tableHeader.attr("aria-sort") === "descending" ||
            $tableHeader.attr("aria-sort") === "none"
        ) {
            $tableHeader.find("button").trigger("click");
        }
    });
}

export function sortDescCopyAssessmentTable(sortCriteria: string): void {
    cy.get(`.pf-m-compact > thead > tr > th[data-label="${sortCriteria}"]`).then(($tableHeader) => {
        if (
            $tableHeader.attr("aria-sort") === "ascending" ||
            $tableHeader.attr("aria-sort") === "none"
        ) {
            $tableHeader.find("button").trigger("click");
        }
    });
}

export function getColumnDataforCopyAssessmentTable(columnName: string): Array<string> {
    selectItemsPerPage(100);
    cy.wait(4000);
    let itemList = [];
    cy.get(".pf-m-compact > tbody > tr")
        .not(".pf-c-table__expandable-row")
        .find(`td[data-label="${columnName}"]`)
        .each(($ele) => {
            if ($ele.text() !== "") itemList.push($ele.text().toString().toLowerCase());
        });
    return itemList;
}

export function getTableColumnData(columnName: string): Array<string> {
    selectItemsPerPage(100);
    let itemList = [];
    cy.get(".pf-c-table > tbody > tr", { timeout: 5 * SEC })
        .not(".pf-c-table__expandable-row")
        .find(`td[data-label="${columnName}"]`)
        .each(($ele) => {
            if (
                columnName === groupCount ||
                columnName === memberCount ||
                columnName === tagCount ||
                columnName === rank ||
                columnName === criticality ||
                columnName === priority ||
                columnName === confidence
            ) {
                if ($ele.text() !== "") itemList.push(Number($ele.text()));
            } else if (columnName === date) {
                if ($ele.text() !== "") itemList.push(new Date($ele.text().toString()).getTime());
            } else {
                if ($ele.text() !== "") itemList.push($ele.text().toString().toLowerCase());
            }
        });
    return itemList;
}

export function verifySortAsc(listToVerify: Array<any>, unsortedList: Array<any>): void {
    cy.wrap(listToVerify).then((capturedList) => {
        let sortedList = unsortedList.sort((a, b) =>
            a.toString().localeCompare(b, "en-us", {
                ignorePunctuation: true,
                numeric: !unsortedList.some(isNaN),
            })
        );
        expect(capturedList).to.be.deep.equal(sortedList);
    });
}

export function verifySortDesc(listToVerify: Array<any>, unsortedList: Array<any>): void {
    cy.wrap(listToVerify).then((capturedList) => {
        let reverseSortedList = unsortedList.sort((a, b) =>
            b.toString().localeCompare(a, "en-us", {
                ignorePunctuation: true,
                numeric: !unsortedList.some(isNaN),
            })
        );
        expect(capturedList).to.be.deep.equal(reverseSortedList);
    });
}

export function expandRowDetails(rowIdentifier: string): void {
    // displays row details by clicking on the expand button
    cy.get(tdTag)
        .contains(rowIdentifier)
        .parent(trTag)
        .within(() => {
            cy.get(commonView.expandRow).then(($btn) => {
                if ($btn.attr("aria-expanded") === "false") {
                    $btn.trigger("click");
                }
            });
        });
}

export function closeRowDetails(rowIdentifier: string): void {
    // closes row details by clicking on the collapse button
    cy.get(tdTag)
        .contains(rowIdentifier)
        .parent(trTag)
        .within(() => {
            if (!button["aria-label=Details"]) {
                return;
            }
            cy.get(commonView.expandRow).then(($btn) => {
                if ($btn.attr("aria-expanded") === "true") {
                    $btn.trigger("click");
                }
            });
        });
}

export function existsWithinRow(
    rowIdentifier: string,
    fieldId: string,
    valueToSearch: string
): void {
    // Verifies if the valueToSearch exists within the row
    cy.get(tdTag)
        .contains(rowIdentifier)
        .parent(trTag)
        .next()
        .find(fieldId)
        .should("contain", valueToSearch);
}

export function notExistsWithinRow(
    rowIdentifier: string,
    fieldId: string,
    valueToSearch: string
): void {
    // Verifies if the valueToSearch does not exists within the row
    cy.get(tdTag)
        .contains(rowIdentifier)
        .parent(trTag)
        .next()
        .find(fieldId)
        .should("not.contain", valueToSearch);
}

export function deleteTableRows(): void {
    cy.get(commonView.appTable).get("tbody").find(trTag).as("rowsIdentifier");
    cy.get("@rowsIdentifier").then(($tableRows) => {
        for (let i = 0; i < $tableRows.length; i++) {
            cy.get("@rowsIdentifier")
                .eq(0)
                .within(() => {
                    click(commonView.deleteButton);
                });
            cy.get(commonView.confirmButton).click();
            cy.wait(2 * SEC);
        }
    });
}

export function importApplication(fileName: string): void {
    // Performs application import via csv file upload
    cy.get(actionButton).eq(1).click();
    clickByText(button, "Import");
    cy.get('input[type="file"]', { timeout: 2 * SEC }).attachFile(fileName, {
        subjectType: "drag-n-drop",
    });
    cy.get("form.pf-c-form", { timeout: 5 * SEC })
        .find("button")
        .contains("Import")
        .click({ force: true });
    checkSuccessAlert(commonView.successAlertMessage, `Success! file saved to be processed.`);
}

export function uploadFile(fileName: string): void {
    // Uplaod any file
    cy.get('input[type="file"]', { timeout: 5 * SEC }).attachFile(fileName, {
        subjectType: "drag-n-drop",
    });
    cy.wait(2000);
}

export function openManageImportsPage(): void {
    // Opens the manage import applications page
    selectUserPerspective("Developer");
    clickByText(navMenu, applicationInventory);
    cy.wait("@getApplication");
    cy.get(actionButton).eq(1).click();
    cy.get("a.pf-c-dropdown__menu-item").contains("Manage imports").click();
    cy.get("h1", { timeout: 5 * SEC }).contains("Application imports");
}

export function openErrorReport(): void {
    // Open error report for the first row
    cy.get("table > tbody > tr").eq(0).as("firstRow");
    cy.get("@firstRow").find(actionButton).click();
    cy.get("@firstRow").find(button).contains("View error report").click();
    cy.get("h1", { timeout: 5 * SEC }).contains("Error report");
}

export function verifyAppImport(
    fileName: string,
    status: string,
    accepted: number,
    rejected: number
): void {
    // Verify the app import features for a single row
    cy.get("table > tbody > tr").eq(0).as("firstRow");
    cy.get("@firstRow").find("td[data-label='File name']").should("contain", fileName);
    cy.get("@firstRow").find("td[data-label='Status']").find("div").should("contain", status);
    cy.get("@firstRow").find("td[data-label='column-4']").should("contain", accepted);
    cy.get("@firstRow").find("td[data-label='column-5']").should("contain", rejected);
}

export function verifyImportErrorMsg(errorMsg: any): void {
    // Verifies if the error message appears in the error report table
    if (Array.isArray(errorMsg)) {
        errorMsg.forEach(function (message) {
            cy.get("table > tbody > tr > td").should("contain", message);
        });
    } else {
        cy.get("table > tbody > tr > td").should("contain", errorMsg);
    }
}

export function deleteApplicationTableRows(lastPage = false): void {
    if (!lastPage) {
        clickByText(navMenu, applicationInventory);
        cy.wait(800);
        // Select 100 items per page
        selectItemsPerPage(100);
        cy.wait(2000);
    }
    cy.get(commonView.appTable)
        .next()
        .then(($div) => {
            if (!$div.hasClass("pf-c-empty-state")) {
                cy.get("tbody")
                    .find(trTag)
                    .not(".pf-c-table__expandable-row")
                    .each(($tableRow) => {
                        let name = $tableRow.find("td[data-label=Name]").text();
                        cy.get(tdTag)
                            .contains(name)
                            .parent(tdTag)
                            .parent(trTag)
                            .within(() => {
                                click(actionButton);
                                cy.wait(800);
                            })
                            .contains(button, deleteAction)
                            .click();
                        cy.wait(800);
                        click(commonView.confirmButton);
                        cy.wait(4000);
                    });
            }
        });
}

export function deleteAppImportsTableRows(lastPage = false): void {
    if (!lastPage) {
        openManageImportsPage();
        // Select 100 items per page
        selectItemsPerPage(100);
        cy.wait(2000);
    }

    cy.get(commonView.appTable)
        .next()
        .then(($div) => {
            if (!$div.hasClass("pf-c-empty-state")) {
                cy.get("tbody")
                    .find(trTag)
                    .not(".pf-c-table__expandable-row")
                    .each(($tableRow) => {
                        var date = $tableRow.find("td[data-label=Date]").text();
                        cy.get(tdTag)
                            .contains(date)
                            .parent(trTag)
                            .within(() => {
                                click(actionButton);
                                cy.wait(800);
                            })
                            .contains(button, deleteAction)
                            .click();
                        cy.wait(800);
                        click(commonView.confirmButton);
                        cy.wait(4000);
                    });
            }
        });
}

export function preservecookies(): void {
    Cypress.Cookies.defaults({
        preserve: /SESSION/,
    });
}

// Checks if the hook has to be skipped, if the tag is not mentioned during test run
export function hasToBeSkipped(tagName: string): boolean {
    if (Cypress.env("grepTags")) {
        if (!Cypress.env("grepTags").includes(tagName)) return true;
    }
    return false;
}

// Perform edit/delete action on the specified row selector by clicking a text button
export function performRowAction(itemName: string, action: string): void {
    // itemName is text to be searched on the screen (like credentials name, stakeholder name, etc)
    // Action is the name of the action to be applied (usually edit or delete)

    cy.get(tdTag)
        .contains(itemName, { timeout: 120 * SEC })
        // .closest(tdTag)
        .closest(trTag)
        .within(() => {
            clickByText(button, action);
            cy.wait(500);
            clickByText(button, action);
        });
}

// Perform edit/delete action on the specified row selector by clicking an icon button
/* As of Tackle 2.1, this function can be used to click the update button and kebab menu for
   applications on the Application Inventory page */
export function performRowActionByIcon(itemName: string, action: string): void {
    // itemName is the text to be searched on the screen (For eg: application name, etc)
    // Action is the name of the action to be applied (For eg: edit or click kebab menu)
    cy.contains(itemName, { timeout: 120 * SEC })
        .closest(trTag)
        .within(() => {
            click(action);
        });
}

export function createMultipleCredentials(numberOfCredentials: number): Array<Credentials> {
    let newCredentialsList: Array<Credentials> = [];
    let createdCredentialsList: Array<Credentials> = [];
    for (let i = 0; i <= Math.ceil(numberOfCredentials / 4); i++) {
        newCredentialsList.push(
            new CredentialsProxy(getRandomCredentialsData(CredentialType.proxy))
        );
        newCredentialsList.push(
            new CredentialsMaven(getRandomCredentialsData(CredentialType.maven))
        );
        newCredentialsList.push(
            new CredentialsSourceControlUsername(
                getRandomCredentialsData(CredentialType.sourceControl)
            )
        );
        newCredentialsList.push(
            new CredentialsSourceControlKey(getRandomCredentialsData(CredentialType.sourceControl))
        );
    }
    newCredentialsList.forEach((currentCredential) => {
        currentCredential.create();
        createdCredentialsList.push(currentCredential);
    });
    return createdCredentialsList;
}

export function createMultipleStakeholders(
    numberOfStakeholders: number,
    jobFunctionList?: Array<Jobfunctions>,
    stakeholderGroupsList?: Array<Stakeholdergroups>
): Array<Stakeholders> {
    let stakeholdersList: Array<Stakeholders> = [];
    for (let i = 0; i < numberOfStakeholders; i++) {
        let jobFunction: string;
        let stakeholderGroupNames: Array<string> = [];
        if (jobFunctionList) jobFunction = jobFunctionList[i].name;
        if (stakeholderGroupsList) stakeholderGroupNames.push(stakeholderGroupsList[i].name);
        // Create new stakeholder
        const stakeholder = new Stakeholders(
            data.getEmail(),
            data.getFullName(),
            jobFunction,
            stakeholderGroupNames
        );
        stakeholder.create();
        stakeholdersList.push(stakeholder);
    }
    return stakeholdersList;
}
export function createMultipleJobFunctions(num): Array<Jobfunctions> {
    let jobFunctionsList: Array<Jobfunctions> = [];
    for (let i = 0; i < num; i++) {
        const jobFunction = new Jobfunctions(data.getFullName());
        jobFunction.create();
        jobFunctionsList.push(jobFunction);
    }
    return jobFunctionsList;
}

export function createMultipleStakeholderGroups(
    numberofstakeholdergroup: number,
    stakeholdersList?: Array<Stakeholders>
): Array<Stakeholdergroups> {
    let stakeholdergroupsList: Array<Stakeholdergroups> = [];
    for (let i = 0; i < numberofstakeholdergroup; i++) {
        let stakeholders: Array<string> = [];
        if (stakeholdersList) stakeholders.push(stakeholdersList[i].name);
        // Create new stakeholder group
        const stakeholdergroup = new Stakeholdergroups(
            data.getCompanyName(),
            data.getDescription(),
            stakeholders
        );
        stakeholdergroup.create();
        stakeholdergroupsList.push(stakeholdergroup);
    }
    return stakeholdergroupsList;
}

export function createMultipleBusinessServices(
    numberofbusinessservice: number,
    stakeholdersList?: Array<Stakeholders>
): Array<BusinessServices> {
    let businessservicesList: Array<BusinessServices> = [];
    for (let i = 0; i < numberofbusinessservice; i++) {
        let stakeholders: string;
        if (stakeholdersList) stakeholders = stakeholdersList[i].name;
        // Create new business service
        const businessservice = new BusinessServices(
            data.getCompanyName(),
            data.getDescription(),
            stakeholders
        );
        businessservice.create();
        businessservicesList.push(businessservice);
    }
    return businessservicesList;
}

export function createMultipleTags(numberoftags: number): Array<Tag> {
    let tagList: Array<Tag> = [];
    for (let i = 0; i < numberoftags; i++) {
        //Create Tag type
        const tagType = new TagType(data.getRandomWord(8), data.getColor(), data.getRandomNumber());
        tagType.create();

        // Create new tag
        const tag = new Tag(data.getRandomWord(6), tagType.name);
        tag.create();
        tagList.push(tag);
    }
    return tagList;
}

export function generateMultipleCredentials(amount: number): Credentials[] {
    cy.pause();
    let newCredentialsList = [];
    let createdCredentialsList = [];
    for (let i = 0; i < Math.ceil((10 - amount) / 4); i++) {
        newCredentialsList.push(
            new CredentialsProxy(getRandomCredentialsData(CredentialType.proxy))
        );
        newCredentialsList.push(
            new CredentialsMaven(getRandomCredentialsData(CredentialType.maven))
        );
        newCredentialsList.push(
            new CredentialsSourceControlUsername(
                getRandomCredentialsData(CredentialType.sourceControl)
            )
        );
        newCredentialsList.push(
            new CredentialsSourceControlKey(getRandomCredentialsData(CredentialType.sourceControl))
        );
    }
    cy.pause();
    newCredentialsList.forEach((currentCredential) => {
        currentCredential.create();
        createdCredentialsList.push(currentCredential);
    });
    cy.pause();
    return createdCredentialsList;
}

export function getRowsAmount(): number {
    let amount: number;
    cy.get(commonView.appTable).get("tbody").find(trTag).as("rowsIdentifier");
    cy.get("@rowsIdentifier").then(($tableRows) => {
        amount = $tableRows.length;
    });
    return amount;
}

export function getRandomApplicationData(options?: { sourceData?; binaryData? }): applicationData {
    let appdata = {
        name: data.getAppName(),
        description: data.getDescription(),
        comment: data.getDescription(),
    };

    if (options) {
        if (options.sourceData) {
            appdata["repoType"] = options.sourceData.repoType;
            appdata["sourceRepo"] = options.sourceData.sourceRepo;
        }
    }

    if (options) {
        if (options.binaryData) {
            appdata["group"] = options.binaryData.group;
            appdata["artifact"] = options.binaryData.artifact;
            appdata["version"] = options.binaryData.version;
            appdata["packaging"] = options.binaryData.packaging;
        }
    }
    return appdata;
}

export function getRandomAnalysisData(sourceData): analysisData {
    var analysisData = {
        source: sourceData.source,
        target: sourceData.target,
        binary: sourceData.binary,
    };
    return analysisData;
}
export function createMultipleApplications(numberofapplications: number): Array<Assessment> {
    let applicationList: Array<Assessment> = [];
    for (let i = 0; i < numberofapplications; i++) {
        // Navigate to application inventory tab and create new application
        const application = new Assessment(getRandomApplicationData());
        application.create();
        applicationList.push(application);
        cy.wait(2000);
    }
    return applicationList;
}

export function createApplicationObjects(numberOfObjects: number): Array<Assessment> {
    let applicationObjectsList: Array<Assessment> = [];
    for (let i = 0; i < numberOfObjects; i++) {
        // Create an object of application
        const application = new Assessment(getRandomApplicationData());
        applicationObjectsList.push(application);
    }
    return applicationObjectsList;
}

export function deleteAllJobfunctions(cancel = false): void {
    Jobfunctions.openList();
    selectItemsPerPage(100);
    cy.wait(2000);
    cy.get(commonView.appTable)
        .next()
        .then(($div) => {
            if (!$div.hasClass("pf-c-empty-state")) {
                cy.get("tbody")
                    .find(trTag)
                    .not(".pf-c-table__expandable-row")
                    .each(($tableRow) => {
                        let name = $tableRow.find("td[data-label=Name]").text();
                        cy.get(tdTag)
                            .contains(name)
                            .parent(tdTag)
                            .siblings(tdTag)
                            .within(() => {
                                click(commonView.deleteButton);
                                cy.wait(800);
                            });
                        click(commonView.confirmButton);
                        cy.wait(4000);
                    });
            }
        });
}

type Deletable = { delete: () => void };

export function deleteByList<T extends Deletable>(array: T[]): void {
    array.forEach((element) => {
        cy.wait(0.8 * SEC);
        element.delete();
    });
}

export function deleteAllStakeholders(cancel = false): void {
    Stakeholders.clickStakeholders();
    selectItemsPerPage(100);
    cy.wait(0.5 * SEC);
    cy.get(commonView.appTable)
        .next()
        .then(($div) => {
            if (!$div.hasClass("pf-c-empty-state")) {
                cy.get("tbody")
                    .find(trTag)
                    .not(".pf-c-table__expandable-row")
                    .each(($tableRow) => {
                        let name = $tableRow.find("td[data-label=Email]").text();
                        cy.get(tdTag)
                            .contains(name)
                            .parent(trTag)
                            .within(() => {
                                click(commonView.deleteButton);
                                cy.wait(800);
                            });
                        click(commonView.confirmButton);
                        cy.wait(4000);
                    });
            }
        });
}

export function deleteAllStakeholderGroups(cancel = false): void {
    Stakeholdergroups.clickStakeholdergroups();
    selectItemsPerPage(100);
    cy.wait(2000);
    cy.get(commonView.appTable)
        .next()
        .then(($div) => {
            if (!$div.hasClass("pf-c-empty-state")) {
                cy.get("tbody")
                    .find(trTag)
                    .not(".pf-c-table__expandable-row")
                    .each(($tableRow) => {
                        let name = $tableRow.find("td[data-label=Name]").text();
                        cy.get(tdTag)
                            .contains(name)
                            .parent(tdTag)
                            .siblings(tdTag)
                            .within(() => {
                                click(commonView.deleteButton);
                                cy.wait(1000);
                            });
                        click(commonView.confirmButton);
                        cy.wait(4000);
                    });
            }
        });
}

// TODO: Review and refactor function below!
export async function deleteAllBusinessServices(cancel = false) {
    let list = await BusinessServices.getList();
    deleteByList(list);
}

export function deleteAllTagTypes(cancel = false): void {
    TagType.openList();
    cy.get(commonView.appTable, { timeout: 2 * SEC })
        .next()
        .then(($div) => {
            if (!$div.hasClass("pf-c-empty-state")) {
                cy.get("tbody")
                    .find(trTag)
                    .not(".pf-c-table__expandable-row")
                    .each(($tableRow) => {
                        cy.wait(1000);
                        let name = $tableRow.find('td[data-label="Tag type"]').text();
                        if (!(data.getDefaultTagTypes().indexOf(name) > -1)) {
                            cy.get(tdTag)
                                .contains(name)
                                .parent(trTag)
                                .within(() => {
                                    click(commonView.deleteButton);
                                    cy.wait(1000);
                                });
                            click(commonView.confirmButton);
                            cy.wait(4000);
                        }
                    });
            }
        });
}

export function deleteAllTagsAndTagTypes(): void {
    const nonDefaultTagTypes = [];
    TagType.openList();

    cy.get(commonView.appTable, { timeout: 2 * SEC })
        .find(trTag)
        .not(commonView.expandableRow)
        .each(($rowGroup) => {
            let typeName = $rowGroup.find(tagLabels.type).text();
            let isDefault = false;
            for (let currentType of data.getDefaultTagTypes()) {
                if (currentType == typeName) {
                    isDefault = true;
                    break; // Exiting from cycle if current tag type belongs to default
                }
            }
            if (!isDefault && typeName !== "") {
                if ($rowGroup.find(tagLabels.count).text() != "0") {
                    nonDefaultTagTypes.push(typeName);
                    expandRowDetails(typeName);
                } else {
                    let currentTagType = new TagType(typeName, data.getColor());
                    currentTagType.delete();
                }
            }
        })
        .then(() => {
            if (nonDefaultTagTypes.length > 0) {
                for (let currentType of nonDefaultTagTypes) {
                    let tagList = [];
                    cy.contains(tdTag, currentType)
                        .closest("tbody")
                        .within(() => {
                            cy.get(tagLabels.name).each(($tagRow) => {
                                let tagName = $tagRow.text();
                                tagList.push(new Tag(tagName, currentType));
                            });
                        })
                        .then(() => {
                            tagList.forEach((currentTag) => {
                                currentTag.delete();
                                tagList = deleteFromArray(tagList, currentTag);
                            });
                        });
                    let currentTagType = new TagType(currentType, data.getColor());
                    currentTagType.delete();
                }
            }
        });
}

export async function deleteAllCredentials() {
    let list = await Credentials.getList();
    list.forEach((currentCred) => {
        currentCred.delete();
    });
}

export const deleteFromArray = <T>(array: T[], el: T): T[] => {
    return array.filter((item) => item !== el);
};

export function goToPage(page: number): void {
    cy.get(divHeader).within(() => {
        cy.get(firstPageButton).then(($firstPageButton) => {
            cy.get(lastPageButton).then(($lastPageButton) => {
                if (
                    !$firstPageButton.hasClass(".pf-m-disabled") ||
                    !$lastPageButton.hasClass(".pf-m-disabled")
                ) {
                    cy.get(pageNumInput, { timeout: 2 * SEC })
                        .clear()
                        .type(page.toString())
                        .type("{enter}");
                }
            });
        });
    });
}

export function selectUserPerspective(userType: string): void {
    cy.get(commonView.optionMenu, { timeout: 30 * SEC })
        .eq(0)
        .then(($a) => {
            $a.click();
            if (userType == "Developer" && $a.find('ul[title="Admin"]').length) {
                clickByText(commonView.userPerspectiveMenu, "Administrator");
                $a.click();
            }
            clickByText(commonView.userPerspectiveMenu, userType);
        });
}

export function selectWithinModal(selector: string): void {
    cy.get(modal).within(() => {
        click(selector);
    });
}

export function clickWithin(parent, selector: string): void {
    cy.get(parent, { timeout: 30 * SEC }).within(() => {
        click(selector);
    });
}

//function to select checkboxes
export function selectCheckBox(selector: string): void {
    cy.get(selector, { timeout: 120 * SEC }).then(($checkbox) => {
        if (!$checkbox.prop("checked")) {
            click(selector);
        }
    });
}

//function to unselect checkboxes
export function unSelectCheckBox(selector: string): void {
    cy.get(selector, { timeout: 120 * SEC }).then(($checkbox) => {
        if ($checkbox.prop("checked")) {
            click(selector);
        }
    });
}

export function applyAction(itemName, action: string): void {
    cy.contains(tdTag, itemName)
        .closest(trTag)
        .within(() => {
            click('button[aria-label="Actions"]');
            clickByText(button, action);
        });
}

export function confirm(): void {
    click(confirmButton);
}

export function validatePagination(): void {
    // Verify next buttons are enabled as there are more than 11 rows present
    cy.get(nextPageButton).each(($nextBtn) => {
        cy.wrap($nextBtn).should("not.be.disabled");
    });

    // Verify that previous buttons are disabled being on the first page
    cy.get(prevPageButton).each(($previousBtn) => {
        cy.wrap($previousBtn).should("be.disabled");
    });

    // Verify that navigation button to last page is enabled
    cy.get(lastPageButton).should("not.be.disabled");

    // Verify that navigation button to first page is disabled being on the first page
    cy.get(firstPageButton).should("be.disabled");

    // Navigate to next page
    cy.get(nextPageButton).eq(0).click();

    // Verify that previous buttons are enabled after moving to next page
    cy.get(prevPageButton).each(($previousBtn) => {
        cy.wrap($previousBtn).should("not.be.disabled");
    });

    // Verify that navigation button to first page is enabled after moving to next page
    cy.get(firstPageButton).should("not.be.disabled");

    // Moving back to the first page
    cy.get(firstPageButton).eq(0).click();
}

export function goToLastPage(): void {
    cy.get(lastPageButton, { timeout: 10 * SEC })
        .eq(0)
        .then(($button) => {
            if (!$button.hasClass(".pf-m-disabled")) {
                clickWithin(divHeader, lastPageButton);
            }
        });
}

export function validateValue(selector, value: string): void {
    if (!value || value === "") {
        cy.log("Value is not defined");
    } else {
        cy.get(selector)
            .invoke("val")
            .then(($input) => {
                expect($input).eq(value);
            });
    }
}
