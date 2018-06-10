FROM diocas/swan-gsoc

ADD ./extension/ /extension/
ADD ./notebooks/ /notebooks/

RUN ipython profile create && \
echo "c.InteractiveShellApp.extensions.append('extension')" >> \
$(ipython profile locate default)/ipython_kernel_config.py && \
cp -r /extension/ $(ipython locate)/extensions/ && \
jupyter nbextension install /extension/frontend --symlink --user && \
jupyter nbextension enable frontend/extension --user

WORKDIR /notebooks/

EXPOSE 8888
USER root

CMD jupyter notebook --port=8888 --ip=0.0.0.0 --no-browser --allow-root
