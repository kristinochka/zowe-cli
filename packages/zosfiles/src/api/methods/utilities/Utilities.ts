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

import { IZosFilesResponse } from "../../doc/IZosFilesResponse";
import { AbstractSession, ImperativeExpect, Headers } from "@zowe/imperative";
import { Tag } from "./doc/Tag";
import { ZosFilesMessages } from "../../constants/ZosFiles.messages";
import { ZosFilesConstants } from "../../constants/ZosFiles.constants";
import { ZosmfRestClient } from "../../../../../rest";
import * as path from "path";
import { ZosFilesUtils } from "../../utils/ZosFilesUtils";
import { IHeaderContent } from "../../../../../rest/src/doc/IHeaderContent";

export class Utilities {
    public static async chtag(session: AbstractSession, ussFileName: string, type: Tag, codeset?: string): Promise<IZosFilesResponse> {
        ImperativeExpect.toNotBeNullOrUndefined(ussFileName,ZosFilesMessages.missingUSSFileName.message);

        if (type === Tag.BINARY) {
            ImperativeExpect.toBeEqual(codeset,undefined,"A codeset cannot be specified for a binary file.");
        }
        const sanitizedPath = ZosFilesUtils.sanitizeUssPathForRestCall(ussFileName);

        const url = path.posix.join(ZosFilesConstants.RESOURCE,ZosFilesConstants.RES_USS_FILES,sanitizedPath);
        const payload = { request: "chtag", action: "set", type: type.valueOf()} as any;
        if (codeset) {
            payload.codeset = codeset;
        }

        await ZosmfRestClient.putExpectJSON(session,
            url,
            [Headers.APPLICATION_JSON, { [Headers.CONTENT_LENGTH] : JSON.stringify(payload).length.toString() }],
            payload);

        return {
            success: true,
            commandResponse: "File tagged successfully."
        };
    }

    public static async putUSSPayload(session: AbstractSession, USSFileName: string, payload: any): Promise<Buffer> {
        ImperativeExpect.toNotBeNullOrUndefined(USSFileName, ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeEqual(USSFileName, "", ZosFilesMessages.missingUSSFileName.message);
        ImperativeExpect.toNotBeNullOrUndefined(payload, ZosFilesMessages.missingPayload.message);
        ImperativeExpect.toNotBeEqual(payload, {}, ZosFilesMessages.missingPayload.message);
        USSFileName = path.posix.normalize(USSFileName);
        // Get a proper destination for the file to be downloaded
        // If the "file" is not provided, we create a folder structure similar to the uss file structure
        if (USSFileName.substr(0, 1) === "/") {
            USSFileName = USSFileName.substr(1);
        }
        USSFileName = encodeURIComponent(USSFileName);

        const endpoint = path.posix.join(ZosFilesConstants.RESOURCE, ZosFilesConstants.RES_USS_FILES, USSFileName);
        const reqHeaders: IHeaderContent[] = [Headers.APPLICATION_JSON, { [Headers.CONTENT_LENGTH] : JSON.stringify(payload).length.toString() }];
        const response: any = await ZosmfRestClient.putExpectBuffer(session, endpoint, reqHeaders, payload);
        return response;
    }

    public static async renameUSSFile(session: AbstractSession, USSFilePath: string, newFilePath: string): Promise<Buffer> {
        ImperativeExpect.toNotBeNullOrUndefined(newFilePath, ZosFilesMessages.missingUSSFileName.message);
        const oldFilePath = USSFilePath.charAt(0) === "/" ? USSFilePath : "/" + USSFilePath;
        const payload = { request: "move",  from: oldFilePath };
        const response = await Utilities.putUSSPayload(session, newFilePath, payload);
        return response;
    }
}
