// Generated by CoffeeScript 1.6.3
(function() {
  window.GitLab = {};

  GitLab.url = null;

  GitLab.sync = function(method, model, options) {
    var extendedOptions;
    extendedOptions = void 0;
    extendedOptions = _.extend({
      beforeSend: function(xhr) {
        if (GitLab.token) {
          return xhr.setRequestHeader("PRIVATE-TOKEN", GitLab.token);
        }
      }
    }, options);
    return Backbone.sync(method, model, extendedOptions);
  };

  GitLab.Model = Backbone.Model.extend({
    sync: GitLab.sync
  });

  GitLab.Collection = Backbone.Collection.extend({
    sync: GitLab.sync
  });

  GitLab.User = GitLab.Model.extend({
    backboneClass: "User",
    url: function() {
      return "" + GitLab.url + "/user";
    },
    initialize: function() {
      return this.sshkeys = new GitLab.SSHKeys();
    }
  });

  GitLab.SSHKey = GitLab.Model.extend({
    backboneClass: "SSHKey"
  });

  GitLab.SSHKeys = GitLab.Collection.extend({
    backboneClass: "SSHKeys",
    url: function() {
      return "" + GitLab.url + "/user/keys";
    },
    model: GitLab.SSHKey
  });

  GitLab.Project = GitLab.Model.extend({
    backboneClass: "Project",
    url: function() {
      return "" + GitLab.url + "/projects/" + (this.id || this.escaped_path());
    },
    initialize: function() {
      this.branches = new GitLab.Branches([], {
        project: this
      });
      return this.members = new GitLab.Members([], {
        project: this
      });
    },
    tree: function(path) {
      return new GitLab.Tree([], {
        project: this,
        path: path
      });
    },
    blob: function(path) {
      return new GitLab.Blob({
        name: path
      }, {
        project: this
      });
    },
    escaped_path: function() {
      return this.get("path_with_namespace").replace("/", "%2F");
    }
  });

  GitLab.Branch = GitLab.Model.extend({
    backboneClass: "Branch"
  });

  GitLab.Branches = GitLab.Collection.extend({
    backboneClass: "Branches",
    url: function() {
      return "" + GitLab.url + "/projects/" + (this.project.escaped_path()) + "/repository/branches";
    },
    initialize: function(models, options) {
      return this.project = options.project;
    },
    model: GitLab.Branch
  });

  GitLab.Member = GitLab.Model.extend({
    backboneClass: "Member"
  });

  GitLab.Members = GitLab.Collection.extend({
    backboneClass: "Members",
    url: function() {
      return "" + GitLab.url + "/projects/" + (this.project.escaped_path()) + "/members";
    },
    initialize: function(models, options) {
      return this.project = options.project;
    },
    model: GitLab.Member
  });

  GitLab.Blob = GitLab.Model.extend({
    backboneClass: "Blob",
    initialize: function(data, options) {
      return this.project = options.project;
    },
    url: function() {
      return "" + GitLab.url + "/projects/" + (this.project.escaped_path()) + "/repository/blobs/" + (this.branch || "master") + "?filepath=" + (this.get("name"));
    }
  });

  GitLab.Tree = GitLab.Collection.extend({
    backboneClass: "Tree",
    model: GitLab.Blob,
    url: function() {
      var call;
      call = "" + GitLab.url + "/projects/" + (this.project.escaped_path()) + "/repository/tree";
      if (this.path) {
        call += "?path=" + this.path;
      }
      return call;
    },
    initialize: function(models, options) {
      this.project = options.project;
      this.path = options.path;
      this.sha = options.sha;
      return this.trees = [];
    },
    parse: function(resp, xhr) {
      var _this = this;
      _(resp).filter(function(obj) {
        return obj.type === "tree";
      }).map(function(obj) {
        return _this.trees.push(_this.project.tree(obj.name));
      });
      return _(resp).filter(function(obj) {
        return obj.type === "blob";
      }).map(function(obj) {
        return new GitLab.Blob(obj, {
          project: _this.project
        });
      });
    }
  });

  GitLab.Client = function(token) {
    this.token = token;
    this.user = new GitLab.User();
    this.project = function(full_path) {
      return new GitLab.Project({
        path: full_path.split("/")[1],
        path_with_namespace: full_path
      });
    };
    return this;
  };

}).call(this);
