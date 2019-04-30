/*
* This program and the accompanying materials are made available under the terms of the
* Eclipse Public License v2.0 which accompanies this distribution, and is available at
* https://www.eclipse.org/legal/epl-v20.html
*
* SPDX-License-Identifier: EPL-2.0
*
* Copyright Contributors to the Zowe Project.
*
*/

import { AbstractSession, ImperativeError, ImperativeExpect, Logger } from "@zowe/imperative";

import { posix } from "path";

import { ZosmfRestClient } from "../../../../../rest";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { Invoke } from "../invoke";

export class Move {
    public static async ussFile(session: AbstractSession, fileName: string, newName: string): Promise<IZosFilesResponse> {
        // required
        ImperativeExpect.toNotBeNullOrUndefined(fileName, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(fileName, "", ZosFilesMessages.missingUSSFileName.message);

        // Format the new endpoint to send the request to
        let endpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES);
        newName = encodeURIComponent(newName);
        endpoint = posix.join(endpoint, newName);
        Logger.getAppLogger().debug(`Endpoint: ${endpoint}`);

        // Format the old endpoint
        let oldEndpoint = posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES);
        newName = encodeURIComponent(newName);
        oldEndpoint = posix.join(oldEndpoint, newName);
        Logger.getAppLogger().debug(`Endpoint: ${oldEndpoint}`);

        try {
            await ZosmfRestClient.putExpectString(session, endpoint, [], { request: "move", from: oldEndpoint });
            return {
                success: true,
                commandResponse: ZosFilesMessages.ussFileDeletedSuccessfully.message
            };
        } catch (error) {
            Logger.getAppLogger().error(error);
            throw error;
        }
    }
}
