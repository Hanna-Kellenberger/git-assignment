from flask import render_template

class IndexGUI:
    def get(self):
        return render_template("index.html")
