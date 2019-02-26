class Form {
	constructor(structure) {
		this.structure	= structure;
		this.password	= undefined;
	}
	
	validatePassword(password, error) {
		if (typeof password == "string" &&
			(this.password === undefined || this.password == password)) {
			this.password = password;
			return true;
		} else return false;
	}
	
	validateEmail(email, error) {
		var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		
		return re.test(String(email).toLowerCase());
	}
	
	validatePositiveNumber(number, error) {
		var n = parseInt(number);
		
		return n != NaN && n > 0;
	}
	
	validateValue(form, key) {
		var ret = {
			valid: true,
			error: ""
		};
		
		if (form.hasOwnProperty(key)) {
			switch (this.structure[key]) {
				case "email":
					if (!this.validateEmail(form[key])) {
						ret.valid = false;
						ret.error = "Invalid email";
					}
					
					break;
				case "positive number":
					if (!this.validatePositiveNumber(form[key])) {
						ret.valid = false;
						ret.error = "Field " + key + " should be a positive number";
					}
					
					break;
				case "password":
					if (!this.validatePassword(form[key])) {
						ret.valid = false;
						ret.error = "Passwords don't match";
					}
					
					break;
				default:
					if (typeof form[key] != this.structure[key]) {
						ret.valid = false;
						ret.error = "Invalid value for field " + key;
					}
			}
		} else {
			ret.valid = false;
			ret.error = "Something went wrong";
		}
		
		return ret;
	}
	
	validate(req, res, html, options, func) {
		var form = req.body;
		var veredict = {
			valid: true, 
			error: ""
		};
		
		for (var key in this.structure) {
			veredict = this.validateValue(form, key);
			
			if (!veredict.valid)
				break;
		}
		
		this.password = undefined;
		
		if (veredict.valid)
			func(req, res, form);
		else {
			options.errorMessage = veredict.error;
			res.render(html, options);
		}
	}
}

module.exports = Form;