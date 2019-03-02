from django.shortcuts import render


# Create your views here.
from backoffice.forms import NameForm


def index(request):
    return render(request, 'backoffice/index.html', {})

def test(request):
    if request=="GET":
        form = NameForm()
        return render(request, 'backoffice/test.html', {'form': form})
    else:     form = NameForm(request.POST)
    return render(request, 'backoffice/test.html', {'form': form})
