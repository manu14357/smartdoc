declare module "react-dropzone" {
  import * as React from "react";

  interface DropzoneProps {
    onDrop: (
      acceptedFiles: File[],
      fileRejections: FileRejection[],
      event: DropEvent,
    ) => void;
    children: (params: {
      getRootProps: () => any;
      getInputProps: () => any;
      acceptedFiles: File[];
    }) => React.ReactNode;
    multiple?: boolean;
  }

  const Dropzone: React.FC<DropzoneProps>;

  export default Dropzone;
}
