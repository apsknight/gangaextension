from notebook.base.handlers import IPythonHandler

class SwanHandler(IPythonHandler):
    def get(self):
        self.write(self.render_template('gangapage.html',
					page_title='Ganga Jobs',
					ganga_page='True',
					terminals_available=self.settings['terminals_available'],
                                        ))
