import { AbortController } from '@azure/abort-controller';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { CancelablePromise } from 'cancelable-promise';
let url = 'https://datagarage.blob.core.windows.net';
let token =
    'BlobEndpoint=https://datagarage.blob.core.windows.net/;QueueEndpoint=https://datagarage.queue.core.windows.net/;FileEndpoint=https://datagarage.file.core.windows.net/;TableEndpoint=https://datagarage.table.core.windows.net/;SharedAccessSignature=sv=2020-02-10&ss=bfqt&srt=sco&sp=rwdlacupx&se=2022-05-12T17:30:08Z&st=2021-05-12T09:30:08Z&spr=https&sig=I2o96ftPYk6epMPtL2i6ndt3M7wQdoOHL29kdEFApaw%3D';
let container = 'files';
let root = 'test';

const handleUploadFiles = async (Files, root, format, fileSize) => {
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

        return new CancelablePromise((resolve, reject, onCancel) => {
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
        console.log(file);
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
                            data.uploadProgress = Number(progress.toFixed(2));
                            data.uploadedData = loadedBytes;
                            return 0;
                        } else {
                            return 0;
                        }
                    });
                }
            );
        } catch (e) {
            console.log(e);
        }
    };

    handleUpload(container, root, token);
};
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
const deleteFile = async (file) => {
    const blobClient = new BlockBlobClient(token, container, file);
    blobClient.delete().catch((err) => {
        console.log(err);
    });
};
const modifyFile = async (oldFileName, newFileName) => {
    let isExist = true;
    try {
        let newBlobClient = new BlockBlobClient(token, container, newFileName);
        let oldBlobClient = new BlockBlobClient(token, container, oldFileName);
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
test('파일 업로드 확인', async () => {
    let Files = new ArrayBuffer(8);
    Files.name = 'test.zip';
    Files.size = 999;
    let fileSize = 10000;
    let format = ['zip', 'pdf', '7z', 'txt', 'jpg'];
    await handleUploadFiles([Files], root, format, fileSize);
    setTimeout(async () => {
        const blobList = await getBlobListfromContainer(url, token, container);
        let tempBlobList = ['234'];
        console.log(blobList);
        await blobList.map((file) => {
            tempBlobList.push(file.name);
        });
        console.log(tempBlobList);
        await expect(tempBlobList).toContain('test/test.zip');
    }, 1000);
});

test('파일명 수정 확인', async () => {
    await modifyFile('test/test.zip', 'test/test_new.zip');
    const blobList = await getBlobListfromContainer(url, token, container);
    let tempBlobList = [];
    blobList.map((file) => {
        tempBlobList.push(file.name);
    });
    expect(tempBlobList).toContain('test/test_new.zip');
});

test('폴더 이동 확인', async () => {
    await modifyFile('test/test_new.zip', 'test_new/test_new.zip');
    const blobList = await getBlobListfromContainer(url, token, container);
    let tempBlobList = [];
    blobList.map((file) => {
        tempBlobList.push(file.name);
    });
    expect(tempBlobList).toContain('test_new/test_new.zip');
});

test('파일 삭제 확인', async () => {
    await deleteFile('test_new/test_new.zip');
    setTimeout(async () => {
        const blobList = await getBlobListfromContainer(url, token, container);
        let tempBlobList = [];
        blobList.map((file) => {
            tempBlobList.push(file.name);
        });
        await expect(
            tempBlobList.some((file) => file === 'test_new/test_new.zip')
        ).toBe(false);
    }, 1000);
});
