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
/// <reference types="cypress" />

import {
    login,
    selectItemsPerPage,
    preservecookies,
    hasToBeSkipped,
    createMultipleBusinessServices,
    deleteByList,
    goToLastPage,
    deleteFromArray,
    validatePagination,
} from "../../../../../utils/utils";
import { SEC } from "../../../../types/constants";
import { pageNumInput, prevPageButton } from "../../../../views/common.view";
import { BusinessServices } from "../../../../models/developer/controls/businessservices";

describe("Business services pagination validations", { tags: "@tier3" }, function () {
    let businessServiceList = [];
    before("Login and Create Test Data", function () {
        // Prevent hook from running, if the tag is excluded from run
        if (hasToBeSkipped("@tier3")) return;

        // Perform login
        login();
        // Create 11 rows
        businessServiceList = createMultipleBusinessServices(11);
    });

    beforeEach("Persist session", function () {
        // Save the session and token cookie for maintaining one login session
        preservecookies();
    });

    it("Navigation button validations", function () {
        // Navigate to business services tab
        BusinessServices.openList(10);

        validatePagination();
    });

    it("Items per page validations", function () {
        // Navigate to business services tab
        BusinessServices.openList();

        // Select 10 items per page
        selectItemsPerPage(10);
        cy.wait(2 * SEC);

        // Verify that only 10 items are displayed
        cy.get("td[data-label=Name]").then(($rows) => {
            cy.wrap($rows.length).should("eq", 10);
        });

        // Select 20 items per page
        selectItemsPerPage(20);
        cy.wait(2 * SEC);

        // Verify that items less than or equal to 20 and greater than 10 are displayed
        cy.get("td[data-label=Name]").then(($rows) => {
            cy.wrap($rows.length).should("be.lte", 20).and("be.gt", 10);
        });
    });

    it("Page number validations", function () {
        // Navigate to business services tab and select 10 items per page
        BusinessServices.openList(10);
        cy.wait(2 * SEC);

        // Go to page number 2
        cy.get(pageNumInput).eq(0).clear().type("2").type("{enter}");

        // Verify that page number has changed, as previous page nav button got enabled
        cy.get(prevPageButton).each(($previousBtn) => {
            cy.wrap($previousBtn).should("not.be.disabled");
        });
    });

    it("Last page item(s) deletion, impact on page reload validation", async () => {
        // Navigate to business services tab and select 10 items per page
        BusinessServices.openList(10);

        cy.wait(2 * SEC);

        // Navigate to last page
        goToLastPage();
        cy.wait(2 * SEC);

        // Delete all items of last page

        let listNamesOnLastPage = await BusinessServices.getNamesListOnPage();
        let listOnLastPage = [];
        businessServiceList.forEach(($element) => {
            for (let currentName of listNamesOnLastPage) {
                if ($element.name === currentName) {
                    listOnLastPage.push($element);
                }
            }
        });
        deleteByList(listOnLastPage);
        listOnLastPage.forEach(($current) => {
            deleteFromArray(businessServiceList, $current);
        });

        // Verify that page is re-directed to previous page
        cy.get("td[data-label=Name]").then(($rows) => {
            cy.wrap($rows.length).should("eq", 10);
        });
    });

    after("Perform test data clean up", function () {
        // Prevent hook from running, if the tag is excluded from run
        if (hasToBeSkipped("@tier3")) return;

        // Delete the business services created before the tests
        deleteByList(businessServiceList);
    });
});
