package main

type PersonRequest struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
}

type Person struct {
	Id        string `dynamo:"Id"`
	FirstName string `dynamo:"FirstName"`
	LastName  string `dynamo:"LastName"`
}

type AwsSession struct {
	Sess *session.Session
	Err  error
}

var awsSess AwsSession

func init() {
	awsSess.Sess, awsSess.Err = session.NewSession()
}
