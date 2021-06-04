import React from 'react';
import { UploadFile } from './index';

import { act, render } from '@testing-library/react';
const TestComponent = () => {
    let url = 'https://datagarage.blob.core.windows.net';
    let token =
        'BlobEndpoint=https://datagarage.blob.core.windows.net/;QueueEndpoint=https://datagarage.queue.core.windows.net/;FileEndpoint=https://datagarage.file.core.windows.net/;TableEndpoint=https://datagarage.table.core.windows.net/;SharedAccessSignature=sv=2020-02-10&ss=bfqt&srt=sco&sp=rwdlacupx&se=2022-05-12T17:30:08Z&st=2021-05-12T09:30:08Z&spr=https&sig=I2o96ftPYk6epMPtL2i6ndt3M7wQdoOHL29kdEFApaw%3D';
    let container = 'files';
    let root = '폴더1';
    let format = ['zip', 'pdf', '7z', 'txt', 'jpg'];
    let fileSize = 10000;
    let upload = UploadFile(url, token, container);
    return (
        <div className="column">
            <input
                type="file"
                multiple={true}
                style={{ marginBottom: '20px' }}
                onChange={(e) => {
                    upload.selectFiles(e.target.files);
                }}
            ></input>
            {upload.getUploadFiles().map((data, index) => {
                return (
                    <div key={index}>
                        {data.name}/{data.uploadProgress}
                    </div>
                );
            })}
            <button
                className={'button'}
                onClick={() => {
                    upload.handleUpload(root, format, fileSize);
                }}
            >
                업로드
            </button>
            <button
                className={'button'}
                onClick={() => {
                    console.log(upload.checkDuplicate(root));
                }}
            >
                중복 체크
            </button>
            <button
                className={'button'}
                onClick={() => {
                    upload.uploadCancel();
                }}
            >
                취소
            </button>
            <button
                className={'button'}
                onClick={() => {
                    upload.modifyFile('test/test.zip', 'test/test1.zip');
                }}
            >
                파일 수정
            </button>
            <button
                className={'button'}
                onClick={() => {
                    upload.moveFolder('test1', '폴더2');
                }}
            >
                폴더 이동
            </button>
            <button
                className={'button'}
                onClick={() => {
                    upload.deleteFile('test');
                }}
            >
                삭제
            </button>
            <button
                className={'button'}
                onClick={() => {
                    console.log(upload.getFolderInfo(root));
                }}
            >
                폴더 정보
            </button>
            {upload.getUploadedFiles().map((data, index) => {
                return (
                    <div key={index}>
                        {data.name}
                        &nbsp;&nbsp;&nbsp;
                        <button
                            onClick={() => {
                                upload.deleteFile(data.name);
                            }}
                        >
                            삭제
                        </button>
                        <a href={data.downloadPath} download>
                            다운로드
                        </a>
                    </div>
                );
            })}
        </div>
    );
};

describe('Upload', () => {
    it('renders header', () => {
        const { getByText } = render(<TestComponent />);
        const uploadButton = getByText('업로드');
        console.log(uploadButton);
        // expect(uploadButton).toBeInTheDocument();
    });
});
