// Generated by CoffeeScript 1.6.3
(function() {
  var GitLab;

  GitLab = function(url, token) {
    var root;
    root = this;
    this.url = url;
    this.token = token;
    this.sync = function(method, model, options) {
      var extendedOptions;
      extendedOptions = void 0;
      extendedOptions = _.extend({
        beforeSend: function(xhr) {
          if (root.token) {
            return xhr.setRequestHeader("PRIVATE-TOKEN", root.token);
          }
        }
      }, options);
      return Backbone.sync(method, model, extendedOptions);
    };
    this.Model = Backbone.Model.extend({
      sync: this.sync
    });
    this.Collection = Backbone.Collection.extend({
      sync: this.sync
    });
    this.User = this.Model.extend({
      backboneClass: "User",
      url: function() {
        return "" + root.url + "/user";
      },
      initialize: function() {
        return this.sshkeys = new root.SSHKeys();
      }
    });
    this.SSHKey = this.Model.extend({
      backboneClass: "SSHKey",
      initialize: function() {
        return this.truncate();
      },
      truncate: function() {
        var key, key_arr, truncated_hash;
        key = this.get('key');
        key_arr = key.split(/\s/);
        if (typeof key_arr === "object" && key_arr.length === 3) {
          truncated_hash = key_arr[1].substr(-20);
          this.set("truncated_key", "..." + truncated_hash + " " + key_arr[2]);
        } else {
          this.set("truncated_key", key);
        }
        return true;
      }
    });
    this.SSHKeys = this.Collection.extend({
      backboneClass: "SSHKeys",
      url: function() {
        return "" + root.url + "/user/keys";
      },
      model: root.SSHKey
    });
    this.Project = this.Model.extend({
      backboneClass: "Project",
      url: function() {
        return "" + root.url + "/projects/" + (this.id || this.escaped_path());
      },
      initialize: function() {
        this.branches = new root.Branches([], {
          project: this
        });
        this.members = new root.Members([], {
          project: this
        });
        this.on("change", this.parsePath);
        return this.parse_path();
      },
      tree: function(path, branch) {
        return new root.Tree([], {
          project: this,
          path: path,
          branch: branch
        });
      },
      blob: function(path, branch) {
        return new root.Blob({
          file_path: path,
          name: _.last(path.split("/"))
        }, {
          branch: branch,
          project: this
        });
      },
      compare: function(from, to) {
        return new root.Compare(null, {
          from: from,
          to: to,
          project: this
        });
      },
      parse_path: function() {
        var split;
        if (this.get("path_with_namespace")) {
          split = this.get("path_with_namespace").split("/");
          this.set("path", _.last(split));
          return this.set("owner", {
            username: _.first(split)
          });
        }
      },
      escaped_path: function() {
        return this.get("path_with_namespace").replace("/", "%2F");
      }
    });
    this.Projects = this.Collection.extend({
      model: root.Project,
      url: function() {
        return "" + root.url + "/projects";
      }
    });
    this.Events = this.Collection.extend({
      backboneClass: "Events",
      parameters: function() {
        var arr;
        arr = [];
        if (this.page) {
          arr.push("page=" + this.page);
        }
        if (this.per_page) {
          arr.push("per_page=" + this.per_page);
        }
        if (arr.length > 0) {
          return "?" + (arr.join('&'));
        } else {
          return "";
        }
      },
      url: function() {
        return "" + root.url + "/projects/" + (this.project.escaped_path()) + "/events" + (this.parameters());
      },
      initialize: function(models, options) {
        if (options == null) {
          options = {};
        }
        if (!options.project) {
          throw "You have to initialize GitLab.Events with a GitLab.Project model";
        }
        this.project = options.project;
        if (options.per_page != null) {
          this.per_page = options.per_page;
        }
        if (options.page != null) {
          return this.page = options.page;
        }
      }
    });
    this.Commit = this.Model.extend({
      backboneClass: "Commit",
      urlRoot: function() {
        return "" + root.url + "/projects/" + (this.project.escaped_path()) + "/repository/commits";
      },
      initialize: function(data, options) {
        var _ref;
        if ((options.project == null) && (((_ref = this.collection) != null ? _ref.project : void 0) == null)) {
          throw "You have to initialize GitLab.Commit with a GitLab.Project model";
        }
        return this.project = options.project || this.collection.project;
      }
    });
    this.Commits = this.Collection.extend({
      backboneClass: "Commits",
      model: root.Commit,
      parameters: function() {
        var arr;
        arr = [];
        if (this.ref_name) {
          arr.push("ref_name=" + this.ref_name);
        }
        if (this.page) {
          arr.push("page=" + this.page);
        }
        if (this.per_page) {
          arr.push("per_page=" + this.per_page);
        }
        if (arr.length > 0) {
          return "?" + (arr.join('&'));
        } else {
          return "";
        }
      },
      url: function() {
        var base;
        base = "" + root.url + "/projects/" + (this.project.escaped_path()) + "/repository/commits";
        return base + this.parameters();
      },
      initialize: function(models, options) {
        if (options == null) {
          options = {};
        }
        if (!options.project) {
          throw "You have to initialize GitLab.Commits with a GitLab.Project model";
        }
        this.project = options.project;
        if (options.ref_name != null) {
          this.ref_name = options.ref_name;
        }
        if (options.page != null) {
          this.page = options.page;
        }
        if (options.per_page != null) {
          return this.per_page = options.per_page;
        }
      }
    });
    this.Diff = this.Model.extend({
      backboneClass: "Diff",
      url: function() {
        return "" + root.url + "/projects/" + (this.project.escaped_path()) + "/repository/commits/" + this.commit.id + "/diff";
      },
      initialize: function(data, options) {
        if (!options.project) {
          throw "You have to initialize GitLab.Diff with a GitLab.Project model";
        }
        if (!options.commit) {
          throw "You have to initialize GitLab.Diff with a GitLab.Commit model";
        }
        this.project = options.project;
        return this.commit = options.commit;
      }
    });
    this.Branch = this.Model.extend({
      backboneClass: "Branch",
      urlRoot: function() {
        return "" + root.url + "/projects/" + (this.project.escaped_path()) + "/repository/branches";
      },
      sync: function(method, model, options) {
        if (method.toLowerCase() === 'create') {
          options.url = "" + root.url + "/projects/" + (this.project.escaped_path()) + "/repository/branches";
        } else {
          options.url = "" + root.url + "/projects/" + (this.project.escaped_path()) + "/repository/branches/" + (this.get('name'));
        }
        return root.sync(method, model, options);
      },
      initialize: function(data, options) {
        var _ref, _ref1;
        if (options == null) {
          options = {};
        }
        if ((((_ref = this.collection) != null ? _ref.project : void 0) == null) && !options.project) {
          throw "You have to initialize Gitlab.Branch with a Gitlab.Project model";
        }
        this.project = ((_ref1 = this.collection) != null ? _ref1.project : void 0) != null ? this.collection.project : options.project;
        if ((this.get('branch_name') != null) && (this.get('name') == null)) {
          return this.set('name', this.get('branch_name'));
        }
      },
      destroy: function(options) {
        var destroy, model, success, xhr;
        if (options == null) {
          options = {};
        }
        model = this;
        success = options.success;
        destroy = function() {
          return model.trigger('destroy', model, model.collection, options);
        };
        options.success = function(resp) {
          if (options.wait || model.isNew()) {
            destroy();
          }
          if (success) {
            success(model, resp, options);
          }
          if (!model.isNew()) {
            return model.trigger('sync', model, resp, options);
          }
        };
        xhr = this.sync('delete', this, options);
        if (!options.wait) {
          destroy();
        }
        return xhr;
      }
    });
    this.Branches = this.Collection.extend({
      backboneClass: "Branches",
      model: root.Branch,
      url: function() {
        return "" + root.url + "/projects/" + (this.project.escaped_path()) + "/repository/branches";
      },
      initialize: function(models, options) {
        options = options || {};
        if (!options.project) {
          throw "You have to initialize GitLab.Branches with a GitLab.Project model";
        }
        return this.project = options.project;
      }
    });
    this.MergeRequest = this.Model.extend({
      backboneClass: "MergeRequest",
      urlRoot: function() {
        return "" + root.url + "/projects/" + (this.project.escaped_path()) + "/merge_request";
      },
      initialize: function(model, options) {
        if (options == null) {
          options = {};
        }
        if (!options.project) {
          throw "You have to initialize GitLab.MergeRequest with a GitLab.Project model";
        }
        return this.project = options.project;
      },
      sync: function(method, model, options) {
        var _ref;
        options = options || {};
        if (method.toLowerCase() === "create") {
          options.url = "" + root.url + "/projects/" + (this.project.escaped_path()) + "/merge_requests";
        } else if (((_ref = options.method) != null ? _ref.toLowerCase() : void 0) === "merge") {
          options.method = "PUT";
          options.url = "" + root.url + "/projects/" + (this.project.escaped_path()) + "/merge_request/" + (this.get('id')) + "/merge";
        }
        return root.sync.apply(this, arguments);
      },
      merge: function(options) {
        var data;
        if (options == null) {
          options = {};
        }
        options.method = "merge";
        if (options.commit_message != null) {
          data = {
            merge_commit_message: options.commit_message
          };
        }
        return this.save(data, options);
      }
    });
    this.MergeRequests = this.Collection.extend({
      backboneClass: "MergeRequests",
      model: root.MergeRequest,
      parameters: function() {
        var arr;
        arr = [];
        if (this.page) {
          arr.push("page=" + this.page);
        }
        if (this.per_page) {
          arr.push("per_page=" + this.per_page);
        }
        if (this.state) {
          arr.push("state=" + this.state);
        }
        if (arr.length > 0) {
          return "?" + (arr.join('&'));
        } else {
          return "";
        }
      },
      url: function() {
        return "" + root.url + "/projects/" + (this.project.escaped_path()) + "/merge_requests" + (this.parameters());
      },
      initialize: function(models, options) {
        if (options == null) {
          options = {};
        }
        if (!options.project) {
          throw "You have to initialize GitLab.MergeRequests with a GitLab.Project model";
        }
        this.project = options.project;
        if (options.page != null) {
          this.page = options.page;
        }
        if (options.per_page != null) {
          this.per_page = options.per_page;
        }
        if (options.state != null) {
          return this.state = options.state;
        }
      },
      fetch: function(options) {
        if (options == null) {
          options = {};
        }
        options.project = this.project;
        return root.Collection.prototype.fetch.apply(this, [options]);
      }
    });
    this.Member = this.Model.extend({
      backboneClass: "Member"
    });
    this.Members = this.Collection.extend({
      backboneClass: "Members",
      url: function() {
        if (this.project != null) {
          return "" + root.url + "/projects/" + (this.project.escaped_path()) + "/members";
        } else if (this.group != null) {
          return "" + root.url + "/groups/" + (this.group.get('id')) + "/members";
        }
      },
      initialize: function(models, options) {
        if (options == null) {
          options = {};
        }
        if (!options.project && !options.group) {
          throw "You have to initialize GitLab.Members with a GitLab.Project model or Gitlab.Group model";
        }
        if (options.project != null) {
          this.project = options.project;
        }
        if (options.group != null) {
          return this.group = options.group;
        }
      },
      model: root.Member,
      create: function(model, options) {
        var collection, success;
        options = options ? _.clone(options) : {};
        if (!_.has(model, "user_id")) {
          throw new Error("You must provide a user_id to add a member.");
        }
        if (!_.has(model, "access_level")) {
          throw new Error("You must provide an access_level to add a member.");
        }
        if (!(model = this._prepareModel(model, options))) {
          return false;
        }
        if (!options.wait) {
          this.add(model, options);
        }
        collection = this;
        success = options.success;
        options.success = function(resp) {
          if (options.wait) {
            collection.add(model, options);
          }
          if (success) {
            return success(model, resp, options);
          }
        };
        model.save(null, options);
        return model;
      }
    });
    this.Group = this.Model.extend({
      backboneClass: "Group",
      url: function() {
        if (this.id) {
          return "" + root.url + "/groups/" + this.id;
        }
      },
      initialize: function() {
        return this.members = new root.Members([], {
          group: this
        });
      }
    });
    this.Groups = this.Collection.extend({
      backboneClass: "Groups",
      url: function() {
        return "" + root.url + "/groups";
      },
      initialize: function(models, options) {
        options = options || {};
        return this.user = options.user;
      },
      model: root.Group
    });
    this.Blob = this.Model.extend({
      backboneClass: "Blob",
      initialize: function(data, options) {
        options = options || {};
        if (!options.project) {
          throw "You have to initialize GitLab.Blob with a GitLab.Project model";
        }
        this.project = options.project;
        this.branch = options.branch || "master";
        this.on("sync", function() {
          return this.set("id", "fakeIDtoenablePUT");
        });
        this.on("change", this.parseFilePath);
        return this.parseFilePath();
      },
      parseFilePath: function(model, options) {
        if (this.get("file_path")) {
          return this.set("name", _.last(this.get("file_path").split("/")));
        }
      },
      sync: function(method, model, options) {
        var baseURL, commit_message;
        options = options || {};
        baseURL = "" + root.url + "/projects/" + (this.project.escaped_path()) + "/repository";
        if (method.toLowerCase() === "read") {
          options.url = "" + baseURL + "/files?file_path=" + (this.get('file_path').replace('/', '%2F')) + "&ref=" + this.branch;
        } else {
          options.url = "" + baseURL + "/files";
        }
        if (method.toLowerCase() === "delete") {
          commit_message = this.get('commit_message') || ("Deleted " + (this.get('file_path')));
          options.url = options.url + ("?file_path=" + (this.get('file_path')) + "&branch_name=" + this.branch + "&commit_message='" + commit_message + "'");
        }
        return root.sync.apply(this, arguments);
      },
      toJSON: function(opts) {
        var attrs, defaults;
        if (opts == null) {
          opts = [];
        }
        defaults = {
          name: this.get("name"),
          file_path: this.get("file_path"),
          branch_name: this.branch,
          content: this.get("content"),
          commit_message: this.get("commit_message") || this.defaultCommitMessage(),
          encoding: this.get("encoding") || 'text'
        };
        if (typeof opts === "Array" && opts.length === 0) {
          return defaults;
        }
        attrs = _.clone(this.attributes);
        attrs.backboneClass = this.backboneClass;
        _.each(opts, function(opt) {
          if (_.has(attrs, opt)) {
            return defaults[opt] = attrs[opt];
          }
        });
        return defaults;
      },
      defaultCommitMessage: function() {
        if (this.isNew()) {
          return "Created " + (this.get("file_path"));
        } else {
          return "Updated " + (this.get("file_path"));
        }
      },
      parse: function(response, options) {
        if (options.parse !== false) {
          if (response.encoding === "base64") {
            response.content = Base64.decode(response.content.replace(/\n/g, ''));
            response.encoding = "text";
          }
        }
        return response;
      }
    });
    this.Tree = this.Collection.extend({
      backboneClass: "Tree",
      model: root.Blob,
      url: function() {
        return "" + root.url + "/projects/" + (this.project.escaped_path()) + "/repository/tree";
      },
      initialize: function(models, options) {
        options = options || {};
        if (!options.project) {
          throw "You have to initialize GitLab.Tree with a GitLab.Project model";
        }
        this.project = options.project;
        this.branch = options.branch || "master";
        this.trees = [];
        if (options.path) {
          this.path = options.path;
          return this.name = _.last(options.path.split("/"));
        }
      },
      fetch: function(options) {
        options = options || {};
        options.data = options.data || {};
        if (this.path) {
          options.data.path = this.path;
        }
        options.data.ref_name = this.branch;
        return root.Collection.prototype.fetch.apply(this, [options]);
      },
      parse: function(resp, xhr) {
        var _this = this;
        _(resp).filter(function(obj) {
          return obj.type === "tree";
        }).map(function(obj) {
          var full_path;
          full_path = [];
          if (_this.path) {
            full_path.push(_this.path);
          }
          full_path.push(obj.name);
          return _this.trees.push(_this.project.tree(full_path.join("/"), _this.branch));
        });
        return _(resp).filter(function(obj) {
          return obj.type === "blob";
        }).map(function(obj) {
          var full_path;
          full_path = [];
          if (_this.path) {
            full_path.push(_this.path);
          }
          full_path.push(obj.name);
          return _this.project.blob(full_path.join("/"), _this.branch);
        });
      }
    });
    this.Compare = this.Model.extend({
      url: function() {
        return "" + root.url + "/projects/" + (this.project.escaped_path()) + "/repository/compare";
      },
      backboneClass: "Compare",
      initialize: function(data, options) {
        options = options || {};
        if (!options.project) {
          throw "You have to initialize GitLab.Compare with a GitLab.Project model";
        }
        if (!options.to) {
          throw "You have to initialize GitLab.Compare with a to options holding a Git reference";
        }
        if (!options.from) {
          throw "You have to initialize GitLab.Compare with a from options holding a Git reference";
        }
        this.project = options.project;
        this.to = options.to;
        return this.from = options.from;
      },
      fetch: function(options) {
        options = options || {};
        options.data = options.data || {};
        options.data.to = this.to;
        options.data.from = this.from;
        return root.Collection.prototype.fetch.apply(this, [options]);
      }
    });
    this.user = new this.User();
    this.project = function(full_path) {
      return new this.Project({
        path: full_path.split("/")[1],
        path_with_namespace: full_path
      });
    };
    return this;
  };

  window.GitLab = GitLab;

}).call(this);
