from notebook.base.handlers import IPythonHandler

class SwanHandler(IPythonHandler):
    def get(self):
        self.write(self.render_template('tree.html',
                                        page_title='Ganga Jobs',
                                        notebook_path='gangajobs',
                                        terminals_available=self.settings['terminals_available'],
                                        server_root=self.settings['server_root_dir'],
                                        share_page=True,
                                        share_tree=False,
                                        ))
