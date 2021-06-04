# Imago-Upload-Util Guide

## 사용법

### **설치**

-   npm install npm-deploy-sample-uhjin

### **초기 설정**

```jsx
import { UploadFile } from 'npm-deploy-sample-uhjin';
```

```jsx
const upload = UploadFile(url, token, container);
```

-   **url** : 'https://스토리지계정명.blob.core.windows.net' (**Required**)
-   **token** : 해당 스토리지 SAS Token (**Required**)
-   **container** : 해당 스토리지에서 사용할 컨테이너명 (**Required**)

### **Methods**

**selectFiles**

```jsx
<input
type="file"
onChange={(e) ⇒ {upload.selectFiles(e.target.files);}
/>
```

업로드 할 파일 선택

-   e.target.files (**Required**)
-   return 값 없음

<br/><br/>

**handleUpload**

```jsx
upload.handleUpload(root, format, fileSize);
```

파일 업로드 트리거

-   **root** : 폴더명 (String) (**Required**)
-   **format** : 업로드 가능한 format 지정 ( ['zip', 'pdf'] 꼴의 배열로 할당 ) (Array) (**Required**)
-   **fileSize** : 업로드 가능한 파일 maximum 크기 (bytes 단위) (Number) (**Required**)
-   return 값 **없음**
    <br/><br/>

**getUploadFiles**

```jsx
upload.getUploadFiles();
```

업로드 할 파일 리스트

-   return 값 **배열**

```jsx
[
{
name: String
size: Number
uploadProgress: Number.toFixed(2)
uploadedData: Number
...
},
{...}
]

```

<br/><br/>

**checkDuplicate**

```jsx
upload.checkDuplicate(root);
```

해당 폴더내 중복된 파일 리턴

-   **root** : 폴더명 (String) (**Required**)
-   return 값 **중복된 파일 배열**
    <br/><br/>

**getUploadedFiles**

```jsx
upload.getUploadedFiles();
```

container 내 모든 파일 리턴

-   return 값 **container 내 모든 파일 배열**
    <br/><br/>

**uploadCancel**

```jsx
upload.uploadCancel();
```

업로드 동작 취소

-   return 값 **없음**
    <br/><br/>

**modifyFile**

```jsx
upload.modifyFile(target, newRoot);
```

경로/파일명 수정

-   **target** : 수정전 경로/파일명 (String) (**Required**)
-   **newRoot** : 수정후 경로/파일명 (String) (**Required**)
-   return 값 **없음**
    <br/><br/>

**moveFolder**

```jsx
upload.moveFolder(target, newRoot);
```

폴더 이동 (폴더 내 모든 파일 경로 수정)

-   **target** : 수정전 폴더 (String) (**Required**)
-   **newRoot** : 수정후 폴더 (String) (**Required**)
-   return 값 없음
    <br/><br/>

**deleteFile**

```jsx
upload.deleteFile(target);
```

해당 파일 삭제

-   **target** : 삭제할 파일 경로/파일명 (String) (**Required**)
    <br/><br/>

**deleteFolder**

```jsx
upload.deleteFolder(target);
```

해당 폴더 삭제

-   **target** : 삭제할 파일 경로/파일명 (String) (**Required**)
    <br/><br/>

**getFolderInfo**

```jsx
upload.getFolderInfo(root);
```

해당 폴더 정보 리턴

-   **target** : 폴더명 (String) (**Required**)
-   return 값 **객체**

```jsx
{
folderAmount: Number,
folderSizeByByte: Number(bytes)
}
```
