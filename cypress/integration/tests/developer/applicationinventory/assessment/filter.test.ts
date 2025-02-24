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
    clickByText,
    exists,
    preservecookies,
    applySearchFilter,
    hasToBeSkipped,
    createMultipleBusinessServices,
    createMultipleTags,
    createMultipleApplications,
    deleteAllBusinessServices,
    deleteAllTagTypes,
    deleteApplicationTableRows,
    selectUserPerspective,
} from "../../../../../utils/utils";
import { navMenu, navTab } from "../../../../views/menu.view";
import {
    applicationInventory,
    button,
    name,
    clearAllFilters,
    description,
    businessService,
    tag,
    assessment,
} from "../../../../types/constants";

import * as data from "../../../../../utils/data_utils";
import { Application } from "../../../../models/developer/applicationinventory/application";

var applicationsList: Array<Application> = [];
var invalidSearchInput = String(data.getRandomNumber());

describe("Application inventory filter validations", { tags: "@tier2" }, function () {
    before("Login and Create Test Data", function () {
        // Prevent hook from running, if the tag is excluded from run
        if (hasToBeSkipped("@tier2")) return;

        // Perform login
        login();
        applicationsList = createMultipleApplications(2);
    });

    beforeEach("Persist session", function () {
        // Save the session and token cookie for maintaining one login session
        preservecookies();

        // Interceptors
        cy.intercept("POST", "/hub/application*").as("postApplication");
        cy.intercept("GET", "/hub/application*").as("getApplication");
    });

    after("Perform test data clean up", function () {
        if (hasToBeSkipped("@tier2")) return;

        deleteAllTagTypes();
        deleteApplicationTableRows();
        deleteAllBusinessServices();
    });

    it("Name filter validations", function () {
        selectUserPerspective("Developer");
        clickByText(navMenu, applicationInventory);
        clickByText(navTab, assessment);

        // Enter an existing name substring and assert
        var validSearchInput = applicationsList[0].name.substring(0, 11);
        applySearchFilter(name, validSearchInput);
        cy.wait(2000);
        exists(applicationsList[0].name);

        if (applicationsList[1].name.indexOf(validSearchInput) >= 0) {
            exists(applicationsList[1].name);
        }
        clickByText(button, clearAllFilters);

        // Enter an exact existing name and assert
        applySearchFilter(name, applicationsList[1].name);
        cy.wait(2000);
        exists(applicationsList[1].name);

        clickByText(button, clearAllFilters);

        // Enter a non-existing name substring and apply it as search filter
        applySearchFilter(name, invalidSearchInput);
        cy.wait(3000);

        // Assert that no search results are found
        cy.get("h2").contains("No applications available");

        // Clear all filters
        clickByText(button, clearAllFilters);
    });

    it("Descriptions filter validations", function () {
        selectUserPerspective("Developer");
        clickByText(navMenu, applicationInventory);
        clickByText(navTab, assessment);

        // Enter an existing description substring and assert
        var validSearchInput = applicationsList[0].description.substring(0, 8);
        applySearchFilter(description, validSearchInput);
        cy.wait(2000);
        exists(applicationsList[0].description);

        if (applicationsList[1].description.indexOf(validSearchInput) >= 0) {
            exists(applicationsList[1].description);
        }
        clickByText(button, clearAllFilters);

        // Enter an exact existing description substring and assert
        applySearchFilter(description, applicationsList[1].description);
        cy.wait(2000);
        exists(applicationsList[1].description);

        clickByText(button, clearAllFilters);

        // Enter a non-existing description substring and apply it as search filter
        applySearchFilter(description, invalidSearchInput);
        cy.wait(3000);

        // Assert that no search results are found
        cy.get("h2").contains("No applications available");

        // Clear all filters
        clickByText(button, clearAllFilters);
    });

    it("Business service filter validations", function () {
        selectUserPerspective("Developer");
        clickByText(navMenu, applicationInventory);
        clickByText(navTab, assessment);

        // Enter an existing businessservice and assert
        var validSearchInput = applicationsList[0].business;
        applySearchFilter(businessService, validSearchInput);
        cy.wait(2000);
        exists(applicationsList[0].business);

        clickByText(button, clearAllFilters);

        // Enter a non-existing business service and apply it as search filter
        applySearchFilter(businessService, data.getRandomWord(5));
        cy.wait(3000);

        // Assert that no search results are found
        cy.get("h2").contains("No applications available");

        // Clear all filters
        clickByText(button, clearAllFilters);
    });

    it("Tag filter validations", function () {
        selectUserPerspective("Developer");
        clickByText(navMenu, applicationInventory);
        clickByText(navTab, assessment);

        // Enter an existing tag and assert
        var validSearchInput = applicationsList[0].tags[0];
        applySearchFilter(tag, validSearchInput);
        cy.wait(2000);

        exists(applicationsList[0].tags[0]);

        clickByText(button, clearAllFilters);

        // Enter a non-existing tag and apply it as search filter
        applySearchFilter(tag, data.getRandomWord(5));
        cy.wait(3000);

        // Assert that no search results are found
        cy.get("h2").contains("No applications available");

        // Clear all filters
        clickByText(button, clearAllFilters);
    });
});
