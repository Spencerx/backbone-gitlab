# GitLab
# --------------------------------------------------------

window.GitLab = {}
GitLab.url = null

# Extend Backbone.Sync
# --------------------------------------------------------

GitLab.sync = (method, model, options) ->
  extendedOptions = undefined
  extendedOptions = _.extend(
    beforeSend: (xhr) ->
      xhr.setRequestHeader "PRIVATE-TOKEN", GitLab.token if GitLab.token
  , options)
  Backbone.sync method, model, extendedOptions

GitLab.Model = Backbone.Model.extend(sync: GitLab.sync)
GitLab.Collection = Backbone.Collection.extend(sync: GitLab.sync)

# Users
# --------------------------------------------------------

GitLab.User = GitLab.Model.extend(
  backboneClass: "User"
  url: -> "#{GitLab.url}/user"
  initialize: ->
    @sshkeys = new GitLab.SSHKeys()
)

# SSH Keys
# --------------------------------------------------------

GitLab.SSHKey = GitLab.Model.extend(
  backboneClass: "SSHKey"
)

GitLab.SSHKeys = GitLab.Collection.extend(
  backboneClass: "SSHKeys"
  url: -> "#{GitLab.url}/user/keys"
  model: GitLab.SSHKey
)

# Project
# --------------------------------------------------------

GitLab.Project = GitLab.Model.extend(
  backboneClass: "Project"
  url: -> "#{GitLab.url}/projects/#{@id || @escaped_path()}"
  initialize: ->
    @branches = new GitLab.Branches([], project:@)
    @members = new GitLab.Members([], project:@)
  tree: (path, branch) ->
    return new GitLab.Tree([], 
      project:@
      path: path
      branch: branch
    )
  blob: (path, branch) ->
    return new GitLab.Blob(
      file_path: path
    ,
      branch: branch
      project:@
    )
  escaped_path: ->
    return @get("path_with_namespace").replace("/", "%2F")
)

# Branches
# --------------------------------------------------------

GitLab.Branch = GitLab.Model.extend(
  backboneClass: "Branch"
)

GitLab.Branches = GitLab.Collection.extend(
  backboneClass: "Branches"
  model: GitLab.Branch

  url: -> "#{GitLab.url}/projects/#{@project.escaped_path()}/repository/branches"
  
  initialize: (models, options) ->
    options = options || {}
    if !options.project then throw "You have to initialize GitLab.Branches with a GitLab.Project model"
    @project = options.project
)

# Members
# --------------------------------------------------------

GitLab.Member = GitLab.Model.extend(
  backboneClass: "Member"
)

GitLab.Members = GitLab.Collection.extend(
  backboneClass: "Members"
  url: -> "#{GitLab.url}/projects/#{@project.escaped_path()}/members"
  initialize: (models, options) ->
    options = options || {}
    if !options.project then throw "You have to initialize GitLab.Members with a GitLab.Project model"
    @project = options.project
  model: GitLab.Member
)

# Tree
# --------------------------------------------------------

GitLab.Tree = GitLab.Collection.extend(
  
  backboneClass: "Tree"
  model: GitLab.Blob
  url: -> "#{GitLab.url}/projects/#{@project.escaped_path()}/repository/tree"
  
  initialize: (models, options) ->
    options = options || {}
    if !options.project then throw "You have to initialize GitLab.Tree with a GitLab.Project model"
    @project = options.project
    @path = options.path
    @branch = options.branch || "master"
    @trees = []

  fetch: (options) ->
    options = options || {}
    options.data = options.data || {}
    options.data.path = @path if @path
    options.data.ref_name = @branch
    GitLab.Collection.prototype.fetch.apply(this, [options])
  
  parse: (resp, xhr) ->
    
    # add trees to trees. we're loosing the tree data but the path here.
    _(resp).filter((obj) =>
      obj.type == "tree"
    ).map((obj) => @trees.push(@project.tree(obj.name, @branch)))

    # add blobs to models. we're loosing the blob data but the path here.
    _(resp).filter((obj) =>
      obj.type == "blob"
    ).map((obj) => 
      full_path = []
      full_path.push @path if @path
      full_path.push obj.name
      @project.blob(full_path.join("/"), @branch)
    )
)

# Blob
# --------------------------------------------------------

GitLab.Blob = GitLab.Model.extend(
  
  backboneClass: "Blob"

  initialize: (data, options) ->
    options = options || {}
    if !options.project then throw "You have to initialize GitLab.Blob with a GitLab.Project model"
    @project = options.project
    @branch = options.branch || "master"
    @on("sync", -> @set("id", "fakeIDtoenablePUT"))
    @on("change", @parseFilePath)
    @parseFilePath()

  parseFilePath: (model, options) ->
    if @get("file_path")
      @set("name", _.last(@get("file_path").split("/")))

  sync: (method, model, options) ->
    options = options || {}
    baseURL = "#{GitLab.url}/projects/#{@project.escaped_path()}/repository"
    if method.toLowerCase() == "read"
      options.url = "#{baseURL}/blobs/#{@branch}"
    else
      options.url = "#{baseURL}/files"
    GitLab.sync.apply(this, arguments)

  toJSON: ->
    {
      file_path: @get("file_path")
      branch_name: @branch
      content: @get("content")
      commit_message: @get("commit_message") || @defaultCommitMessage()
    }
  
  defaultCommitMessage: ->
    if @isNew()
      "Created #{@get("file_path")}"
    else
      "Updated #{@get("file_path")}"
  
  fetchContent: (options) ->
    @fetch(
      _.extend(
        dataType:"html"
        data: filepath: @get("file_path")
      , options)
    )

  parse: (response, options) ->
    # if response is blob content from /blobs
    if _.isString(response)
      content: response
    # if response is blob object from /files
    else
      response
)

# Client
# --------------------------------------------------------

GitLab.Client = (token) ->
  
  @token  = token
  @user   = new GitLab.User()

  @project = (full_path) ->
    return new GitLab.Project(
      path: full_path.split("/")[1]
      path_with_namespace: full_path
    )

  return @