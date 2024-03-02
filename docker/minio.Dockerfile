FROM minio/minio
COPY ./docker/minio-init.sh ./minio-init.sh
RUN chmod +x minio-init.sh
ENTRYPOINT ["./minio-init.sh"]
