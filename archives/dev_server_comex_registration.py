"""
Flask server used to test the registration page for comex app

(in production this script is not used anymore
 => the registration page will be a static form
    with js and cgi-bin answers management )

 => TODO more generic use the server to generate the form and validation

"""
__author__    = "CNRS"
__copyright__ = "Copyright 2016 ISCPIF-CNRS"
__version__   = "1"
__email__     = "romain.loth@iscpif.fr"
__status__    = "Test"

from flask  import Flask, render_template, request
from ctypes import c_int
from time   import sleep

# ============= app creation =============
app = Flask(__name__)

app.config['DEBUG'] = True

# ============= views =============
@app.route("/", methods=['GET','POST'])
def one_big_form():
    if request.method == 'GET':
        return render_template("base_layout.html")
    elif request.method == 'POST':
        # ex: request.form = ImmutableMultiDict([('initials', 'R.L.'), ('email', 'romain.loth@iscpif.fr'), ('last_name', 'Loth'), ('country', 'France'), ('first_name', 'Romain'), ('my-captchaHash', '-773776109'), ('my-captcha', 'TSZVIN')])
        # print("GOT ANSWERS <<========<<", request.form)

        # 1 - testing the captcha answer
        userinput = request.form['my-captcha']
        userhash = re_hash(userinput)
        captchash = int(request.form['my-captchaHash'])
        if userhash != captchash:
            print("captcha rejected")
            sleep(3)
            return render_template("thank_you.html", form_accepted = False)

        # normal case
        else:
            print("OK accepted")
        return render_template("thank_you.html", form_accepted = True)


# def re_hash(userinput, salt="#salt"):
def re_hash(userinput, salt=""):
    """
    my rewrite of keith-wood.name/realPerson.html python's version
    """
    hashk = 5381

    value = userinput.upper() + salt
    for i, char in enumerate(value):

        hashk = c_int( ((hashk << 5) + hashk + ord(char)) & 0xFFFFFFFF ).value
        # bitwise masks 0xFFFFFFFF to go back to int32 each time
        # c_int( previous ).value to go from unsigned ints to c signed ints each time
        print(i, hashk)
    return hashk


if __name__ == "__main__":
    app.run()
