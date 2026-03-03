How we handle in minio if same name file is sent by the user  ?  Not implemented 
    (we are already using the name + timestamp)
    Either create a file name + 1 or 
    say user same name file exists  or 
    say user same name file exists if he sends again +1 is sent 

How to run minio locally ( use docker ) 
     docker run -d -p 9000:9000 -p 9001:9001 --name minio -e MINIO_ROOT_USER=minioadmin -e MINIO_ROOT_PASSWORD=minioadmin minio/minio server /data --console-address ":9001"

