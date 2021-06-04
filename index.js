import { AbortController } from '@azure/abort-controller';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { CancelablePromise } from 'cancelable-promise';
import { useEffect, useState } from 'react';

export const UploadFile = (url, token, container) => {
    const [fileArray, setFileArray] = useState([]);
    const [Files, setFiles] = useState([]);
    const [getBlobInfoPromise, setGetBlobInfoPromise] = useState(null);
    const [blobList, setBlobList] = useState([]);
    const getBlobListfromContainer = async (url, token, container) => {
        let tempBlobLists = [];
        const blobServiceClient = await new BlobServiceClient(url, token);
        const containerClient = await blobServiceClient.getContainerClient(
            container
        );
        const getListBolbs = async () => {
            for await (const blob of containerClient.listBlobsFlat()) {
                blob.downloadPath = `${url}/${container}/${blob.name}`;
                tempBlobLists.push(blob);
            }
        };
        await getListBolbs();
        return tempBlobLists;
    };
    useEffect(() => {
        const getBlobList = async () => {
            let blobListfromContainer = await getBlobListfromContainer(
                url,
                token,
                container
            );
            setBlobList(blobListfromContainer);
        };
        getBlobList();
    }, [url, token, container]);

    const handleUploadFiles = async (root, format, fileSize) => {
        const handleUpload = async (container, root, token) => {
            for (const file of Files) {
                if (
                    format &&
                    format.includes(file?.name?.split('.')?.reverse()[0]) &&
                    file.size / (1024 * 1024) < fileSize
                ) {
                    await fileUpload(container, root, file, token);
                }
            }
        };
        const uploadBlobAs = (container, root, file, token, onProgress) => {
            const controller = new AbortController();
            const blobName = `${root}/${file.name}`;
            const blobClient = new BlockBlobClient(token, container, blobName);

            return new CancelablePromise(async (resolve, reject, onCancel) => {
                onCancel(() => {
                    controller.abort();
                });

                blobClient
                    .uploadData(file, {
                        onProgress,
                        abortSignal: controller.signal,
                    })
                    .then((storageResponse) => {
                        const blobInfo = {
                            container,
                            fileName: file.name,
                            blobName,
                            downloadPath: storageResponse._response.request.url
                                .split('?')[0]
                                .replace('%2F', '/'),
                            fileSize: file.size,
                        };
                        resolve(blobInfo);
                    })
                    .catch((err) => {
                        reject(new Error(err));
                    });
            });
        };

        const fileUpload = async (container, root, file, token) => {
            try {
                const getBlobInfoPromise = uploadBlobAs(
                    container,
                    root,
                    file,
                    token,
                    ({ loadedBytes }) => {
                        Array.from(Files).map((data) => {
                            const progress = (loadedBytes / data?.size) * 100;
                            if (data?.name === file?.name) {
                                data.uploadProgress = Number(
                                    progress.toFixed(2)
                                );
                                data.uploadedData = loadedBytes;
                                let waitingFile = Array.from(fileArray).filter(
                                    (data) => data?.name !== file?.name
                                );
                                setFileArray(
                                    [data, waitingFile]
                                        .flat()
                                        .sort((a, b) => a?.index - b?.index)
                                );
                                return 0;
                            } else {
                                return 0;
                            }
                        });
                    }
                );
                setGetBlobInfoPromise(getBlobInfoPromise);

                await getBlobInfoPromise;
            } catch (e) {
                console.log(e);
            }
        };

        handleUpload(container, root, token);
    };

    const deleteFile = async (file) => {
        const blobClient = new BlockBlobClient(token, container, file);
        blobClient.delete().catch((err) => {
            console.log(err);
        });
    };

    const deleteFolder = async (folder) => {
        let innerFolderFiles = [];
        blobList.map((file) => {
            if (file?.name.split('/')[0] === folder) {
                innerFolderFiles.push(file);
            }
        });
        innerFolderFiles.map((file) => {
            const blobClient = new BlockBlobClient(token, container, file.name);
            blobClient.delete().catch((err) => {
                console.log(err);
            });
        });
    };

    const modifyFile = async (oldFileName, newFileName) => {
        let isExist = true;
        try {
            let newBlobClient = new BlockBlobClient(
                token,
                container,
                newFileName
            );
            let oldBlobClient = new BlockBlobClient(
                token,
                container,
                oldFileName
            );
            await newBlobClient.beginCopyFromURL(oldBlobClient.url);
        } catch (e) {
            console.log(e);
            isExist = false;
        }
        if (isExist) {
            const newBlobClient = new BlockBlobClient(
                token,
                container,
                newFileName
            );
            const oldBlobClient = new BlockBlobClient(
                token,
                container,
                oldFileName
            );
            await newBlobClient.beginCopyFromURL(oldBlobClient.url);
            await oldBlobClient.delete();
            return newBlobClient;
        }
    };
    const moveFolder = async (oldFolderName, newFolderName) => {
        let tempBlobLists = [];
        const blobServiceClient = await new BlobServiceClient(url, token);
        const containerClient = await blobServiceClient.getContainerClient(
            container
        );
        const getBlobLists = async () => {
            for await (const blob of containerClient.listBlobsFlat()) {
                tempBlobLists.push(blob);
            }
            await handleMoveFolder();
        };
        const handleMoveFolder = async () => {
            for await (let blob of tempBlobLists) {
                if (
                    blob?.name
                        .split('/')
                        .slice(0, blob?.name.split('/').length - 1)
                        .join('/') === oldFolderName
                ) {
                    let newBlobClient = new BlockBlobClient(
                        token,
                        container,
                        `${newFolderName}/${
                            blob?.name?.split('/')?.reverse()[0]
                        }`
                    );
                    let oldBlobClient = new BlockBlobClient(
                        token,
                        container,
                        blob?.name
                    );
                    await newBlobClient.beginCopyFromURL(oldBlobClient.url);
                    await oldBlobClient.delete();
                }
            }
        };
        getBlobLists();
    };
    const handleCheckDuplicate = (root) => {
        let DuplicateFiles = [];
        blobList.map((uploadedData) => {
            Array.from(Files).map((file) => {
                if (uploadedData.name === `${root}/${file.name}`) {
                    DuplicateFiles.push(file);
                }
                return 0;
            });
            return 0;
        });
        return DuplicateFiles;
    };
    const handleFolderInfo = (root) => {
        let totalFolderSize = 0;
        let totalFolderAmount = 0;
        blobList.map((file) => {
            let fileRoot = file.name.split('/')[0];
            if (fileRoot === root) {
                totalFolderAmount += 1;
                totalFolderSize += file.properties.contentLength;
            }
            return 0;
        });
        return {
            folderAmount: totalFolderAmount,
            folderSizeByByte: totalFolderSize,
        };
    };
    return {
        selectFiles: (props) => {
            // 파일 선택
            setFiles(props);
        },
        handleUpload: (root, format, fileSize) => {
            // 업로드 시작
            handleUploadFiles(root, format, fileSize);
        },
        checkDuplicate: (root) => {
            // 업로드 중복 확인 (new 06/02)
            return handleCheckDuplicate(root);
        },
        getUploadedFiles: () => {
            // 원격저장소 리스트 반환
            return blobList;
        },
        uploadCancel: () => {
            // 업로드 취소
            return getBlobInfoPromise?.cancel();
        },
        getUploadFiles: () => {
            // 업로드 리스트 반환
            return Array.from(Files);
        },
        modifyFile: (oldFileName, newFileName) => {
            // 파일 수정
            modifyFile(oldFileName, newFileName);
        },
        moveFolder: (oldFolderName, newFolderName) => {
            // 폴더 이동
            moveFolder(oldFolderName, newFolderName);
        },
        deleteFile: (file) => {
            // 파일 삭제
            deleteFile(file);
        },
        deleteFolder: (folder) => {
            // 폴더 삭제 (new 06/02)
            deleteFolder(folder);
        },
        getFolderInfo: (root) => {
            // 폴더 정보 반환 (new 06/02)
            return handleFolderInfo(root);
        },
    };
};
