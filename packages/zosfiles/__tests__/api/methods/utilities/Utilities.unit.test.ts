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

import { Utilities, IZosFilesResponse, ZosFilesMessages, Tag, ZosFilesConstants } from "../../../../src/api";
import { Session, Headers } from "@zowe/imperative";
import { ZosmfRestClient } from "../../../../../rest";

describe("USS utiliites", () => {
    let error: Error;
    let response: IZosFilesResponse;
    const dummySession = new Session({
        user: "fake",
        password: "fake",
        hostname: "fake",
        port: 443,
        protocol: "https",
        type: "basic"
    });

    beforeEach(() => {
        error = undefined;
    });

    describe("chtag", () => {

        it("should throw an error if filename is missing", async () => {
            try {
                response = await Utilities.chtag(dummySession,undefined,undefined);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });

        it("should throw an error if codeset is specified with Tag.BINARY", async () => {
            try {
                response = await Utilities.chtag(dummySession,"/testfile",Tag.BINARY,"ISO8859-1");
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain("A codeset cannot be specified for a binary file.");
        });

        it("should make a REST request to set the tag to binary", async () => {
           await testChtagExpectPayload({type: Tag.BINARY}, { request: "chtag", action: "set", type: "binary"});
        });

        it("should make a REST request to set the tag to text", async () => {
            await testChtagExpectPayload({type: Tag.TEXT}, { request: "chtag", action: "set", type: "text"});
        });

        it("should make a REST request to set the tag with a codeset", async () => {
            await testChtagExpectPayload({type: Tag.TEXT, codeset: "ISO8859-1"},
                                         {request: "chtag", action: "set", type: "text", codeset: "ISO8859-1"});
        });

        it("should URI-encoded the path", async () => {
            const restClientSpy = jest.spyOn(ZosmfRestClient, "putExpectJSON").mockReturnValue({});

            response = await Utilities.chtag(dummySession,"/test file",Tag.TEXT,"ISO8859-1");

            expect(response.success).toBeTruthy();
            const expectedUrl = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + "/test%20file";
            expect(restClientSpy).toHaveBeenCalledWith(dummySession, expectedUrl, expect.anything(),
                expect.anything());
        });

        async function testChtagExpectPayload(args: IChtagArgs, expectedPayload: any) {
            const restClientSpy = jest.spyOn(ZosmfRestClient, "putExpectJSON").mockReturnValue({});

            response = await Utilities.chtag(dummySession,"/testfile",args.type,args.codeset);

            expect(response.success).toBeTruthy();
            const expectedUrl = ZosFilesConstants.RESOURCE + ZosFilesConstants.RES_USS_FILES + "/testfile";
            expect(restClientSpy).toHaveBeenCalledWith(dummySession, expectedUrl,
                [Headers.APPLICATION_JSON, { [Headers.CONTENT_LENGTH] : JSON.stringify(expectedPayload).length.toString() }],
                expectedPayload);
        }
    });

    describe("putUSSPayload", () => {
        const zosmfExpectSecondSpy = jest.spyOn(ZosmfRestClient, "putExpectBuffer");
        const payload = {request: "move", action: "/u/zowe/test"};
        const content = new Buffer(JSON.stringify({}));

        beforeEach(() => {
            zosmfExpectSecondSpy.mockClear();
            zosmfExpectSecondSpy.mockImplementation(() => content);
        });

        it("should throw an error if the uss file name is null", async () => {
            let myResponse;
            let caughtError;

            try {
                myResponse = await Utilities.putUSSPayload(dummySession, null, payload);
            } catch (e) {
                caughtError = e;
            }

            expect(myResponse).toBeUndefined();
            expect(caughtError).toBeDefined();
            expect(caughtError.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });
    });

    describe("renameUSSFile", () => {
        it("should fail if new file path is not passed in", async () => {
            try {
                await Utilities.renameUSSFile(dummySession, "/u/zowe/test", undefined);
            } catch (err) {
                error = err;
            }

            expect(error).toBeDefined();
            expect(error.message).toContain(ZosFilesMessages.missingUSSFileName.message);
        });
        it("should execute if all parameters are provided", async () => {
            let renameResponse;
            jest.spyOn(ZosmfRestClient, "putExpectBuffer").mockReturnValue({});
            const zosmfExpectSecondSpy = jest.spyOn(Utilities, "putUSSPayload");
            const oldPath = "/u/zowe/test";
            const newPath= "/u/zowe/test1";
            try {
                renameResponse = await Utilities.renameUSSFile(dummySession, oldPath, newPath);
            } catch (err) {
                error = err;
            }
            expect(error).not.toBeDefined();
            expect(renameResponse).toBeTruthy();
            const payload = { request: "move", from: oldPath };
            expect(zosmfExpectSecondSpy).toHaveBeenLastCalledWith(dummySession, newPath, payload);
        });
    });
});
interface IChtagArgs {
    type: Tag;
    codeset?: string;
}
