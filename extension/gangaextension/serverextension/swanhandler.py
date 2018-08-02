from notebook.base.handlers import IPythonHandler

class SwanHandler(IPythonHandler):

    def get(self):
        "This method renders the Jobs Page in SWAN Tree view."

        self.write(self.render_template('gangapage.html',
					page_title='Jobs',
					ganga_page='True',
					terminals_available=self.settings['terminals_available'],
                                        ))
